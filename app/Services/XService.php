<?php

namespace App\Services;

use App\Jobs\TokenRefresh;
use App\Models\PostMetric;
use App\Models\UserPostSystem;
use App\Models\UserToken;
use Date;
use Exception;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use JetBrains\PhpStorm\NoReturn;
use Storage;

class XService implements ISocialService
{
    // X allows chunks up to 5MB; stay under it to leave room for multipart overhead.
    private const VIDEO_CHUNK_BYTES = 4 * 1024 * 1024;

    /**
     * @throws ConnectionException
     * @throws Exception
     */
    public function createPost(UserPostSystem $userPostSystem, string $content, ?string $media = null): void
    {
        $content = $userPostSystem->override_content ?? $content;
        $accessToken = $userPostSystem->userToken->access_token;

        $payload = [
            'text' => $content,
        ];

        if ($media != null) {
            $file = Storage::disk('r2')->get($media);
            $videoMediaType = $this->videoMediaType($media);

            $mediaID = $videoMediaType
                ? $this->uploadVideo($accessToken, $file, $videoMediaType)
                : $this->uploadImage($accessToken, $file);

            $payload['media'] = ['media_ids' => [$mediaID]];
            $payload['made_with_ai'] = false;
        }

        $response = Http::withToken($accessToken)->post('https://api.x.com/2/tweets', $payload);

        if ($response->getStatusCode() != 201) {
            throw new Exception('failed to create post');
        }

        $responseId = $response['data']['id'];

        UserPostSystem::query()->where('id', $userPostSystem->id)->update(['created_post_Id' => $responseId]);
    }

    private function videoMediaType(string $media): ?string
    {
        return match (strtolower(pathinfo($media, PATHINFO_EXTENSION))) {
            'mp4' => 'video/mp4',
            'mov', 'qt' => 'video/quicktime',
            default => null,
        };
    }

    /**
     * @throws ConnectionException
     * @throws Exception
     */
    private function uploadImage(string $accessToken, string $file): string
    {
        $mediaUploadResponse = Http::withToken($accessToken)->attach('media', $file, 'media.jpg')->post('https://api.x.com/2/media/upload',
            [
                'media_category' => 'tweet_image',
                'media_type' => 'image/jpeg',
            ])->json();

        $mediaID = $mediaUploadResponse['data']['id'];

        if (array_key_exists('processing_info', $mediaUploadResponse)) {
            $this->waitForProcessing($accessToken, $mediaID);
        }

        return $mediaID;
    }

    /**
     * Videos must go through X's chunked upload flow:
     * initialize -> append (in <=5MB segments) -> finalize -> poll status.
     *
     * @throws ConnectionException
     * @throws Exception
     */
    private function uploadVideo(string $accessToken, string $file, string $mediaType): string
    {
        $initializeResponse = Http::withToken($accessToken)->post('https://api.x.com/2/media/upload/initialize',
            [
                'media_type' => $mediaType,
                'total_bytes' => strlen($file),
                'media_category' => 'tweet_video',
            ])->json();

        $mediaID = $initializeResponse['data']['id'] ?? null;

        if ($mediaID === null) {
            throw new Exception('Failed to initialize video upload');
        }

        $totalBytes = strlen($file);
        $segmentIndex = 0;

        for ($offset = 0; $offset < $totalBytes; $offset += self::VIDEO_CHUNK_BYTES) {
            $chunk = substr($file, $offset, self::VIDEO_CHUNK_BYTES);

            $appendResponse = Http::withToken($accessToken)
                ->attach('media', $chunk, 'media')
                ->post('https://api.x.com/2/media/upload/'.$mediaID.'/append', [
                    'segment_index' => $segmentIndex,
                ]);

            if ($appendResponse->failed()) {
                throw new Exception('Failed to upload video segment '.$segmentIndex);
            }

            $segmentIndex++;
        }

        $finalizeResponse = Http::withToken($accessToken)->post('https://api.x.com/2/media/upload/'.$mediaID.'/finalize')->json();

        if (array_key_exists('processing_info', $finalizeResponse['data'] ?? [])) {
            $this->waitForProcessing($accessToken, $mediaID);
        }

        return $mediaID;
    }

    /**
     * @throws ConnectionException
     * @throws Exception
     */
    private function waitForProcessing(string $accessToken, string $mediaID): void
    {
        $attempts = 0;

        while (true) {
            $statusResponse = Http::withToken($accessToken)->get('https://api.x.com/2/media/upload', [
                'command' => 'STATUS',
                'media_id' => $mediaID,
            ])->json();

            $processingInfo = $statusResponse['data']['processing_info'] ?? $statusResponse['processing_info'] ?? [];
            $state = $processingInfo['state'] ?? 'succeeded';

            if ($state === 'succeeded') {
                return;
            }

            if ($state === 'failed') {
                throw new Exception('X failed to process the uploaded media');
            }

            if (++$attempts > 10) {
                throw new Exception('Failed to upload media after 10 attempts');
            }

            Sleep::for($processingInfo['check_after_secs'] ?? 5)->seconds();
        }
    }

    public function getPosts()
    {
        // TODO: Implement getPosts() method.
    }

    /**
     * @throws ConnectionException
     */
    public function refreshToken(UserToken $userToken): void
    {
        $response = Http::post('https://api.x.com/2/oauth2/token', [
            'grant_type' => 'refresh_token',
            'refresh_token' => $userToken->refresh_token,
            'client_id' => env('X_CLIENT_ID'),
        ]);
        $user = $response->json();

        $userToken->update([
            'access_token' => $user['access_token'],
            'refresh_token' => $user['refresh_token'],
            'expires_at' => Date::now()->addSeconds($user['expires_in']),
        ]);

        TokenRefresh::dispatch($userToken)->delay(Date::now()->addSeconds($user['expires_in'] - 60));
    }

    /**
     * @throws ConnectionException
     */
    #[NoReturn]
    public function getPostMetrics(UserPostSystem $userPostSystem): void
    {

        $mediaUploadResponse = Http::withToken($userPostSystem->userToken->access_token)->get('https://api.x.com/2/tweets/'.$userPostSystem->created_post_Id,
            [
                'tweet.fields' => 'public_metrics',
            ])->json();

        if (array_key_exists('errors', $mediaUploadResponse)) {
            return;
        }

        $likeCount = $mediaUploadResponse['data']['public_metrics']['like_count'];
        $impressionCount = $mediaUploadResponse['data']['public_metrics']['impression_count'];
        $replyCount = $mediaUploadResponse['data']['public_metrics']['reply_count'];

        PostMetric::create([
            'likes' => $userPostSystem->likes ?? 0,
            'replies' => $userPostSystem->replies ?? 0,
            'impressions' => $userPostSystem->impressions ?? 0,
            'user_post_system_id' => $userPostSystem->id,
        ]);

        $userPostSystem->update([
            'likes' => $likeCount,
            'replies' => $replyCount,
            'impressions' => $impressionCount,
        ]);

        $userPostSystem->save();
    }
}
