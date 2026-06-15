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
use JetBrains\PhpStorm\NoReturn;
use Storage;

class XService implements SocialServiceInterface
{
    /**
     * @throws ConnectionException
     * @throws Exception
     */
    public function createPost(UserPostSystem $userPostSystem, string $content, ?string $media = null): void
    {
        if ($media != null) {
            $file = Storage::disk('r2')->get($media);

            $content = $userPostSystem->override_content ?? $content;
            $mediaUploadResponse = Http::withToken($userPostSystem->userToken->access_token)->attach('media', $file, 'media.jpg')->post('https://api.x.com/2/media/upload',
                [
                    'media_category' => 'tweet_image',
                    'media_type' => 'image/jpeg',
                ])->json();

            $mediaID = $mediaUploadResponse['data']['id'];

            if (array_key_exists('processing_info', $mediaUploadResponse)) {
                $processed = false;
                $attempts = 0;

                while (! $processed) {
                    $attempts++;
                    $uploadStatusResponse = Http::withToken($userPostSystem->userToken->access_token)->get('https://api.x.com/2/media/upload', ['media_id' => $mediaID]);
                    if ($uploadStatusResponse['processing_info']['state'] === 'succeeded') {
                        $processed = true;
                    }
                }

                if ($attempts > 10) {
                    throw new Exception(
                        'Failed to upload media after 10 attempts'
                    );
                }

            }

            $response = Http::withToken($userPostSystem->userToken->access_token)->post('https://api.x.com/2/tweets',
                [
                    'text' => $content,
                    'media' => [
                        'media_ids' => [$mediaID],
                    ],
                    'made_with_ai' => false,
                ]);

            if ($response->getStatusCode() != 201) {
                throw new Exception('failed to create post');
            }

            $responseId = $response['data']['id'];

        } else {
            $response = Http::withToken($userPostSystem->userToken->access_token)->post('https://api.x.com/2/tweets',
                [
                    'text' => $content,
                ]);

            if ($response->getStatusCode() != 201) {
                throw new Exception('failed to create post');
            }

            $responseId = $response['data']['id'];
        }

        UserPostSystem::query()->where('id', $userPostSystem->id)->update(['created_post_Id' => $responseId]);
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
