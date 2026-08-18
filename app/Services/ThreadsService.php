<?php

namespace App\Services;

use App\Concerns\MarksTokensForReauth;
use App\Models\PostMetric;
use App\Models\UserPostSystem;
use App\Models\UserToken;
use Date;
use Exception;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;

class ThreadsService implements ISocialService
{
    use MarksTokensForReauth;

    public function getPosts()
    {
        // TODO: Implement getPosts() method.
    }

    /**
     * @throws ConnectionException
     * @throws Exception
     */
    public function createPost(UserPostSystem $userPostSystem, string $content, ?string $media = null): void
    {
        $content = $userPostSystem->override_content ?? $content;
        $media_url = env('R2_PUBLIC_ENDPOINT').'/'.$media;

        $payload = [
            'text' => $content,
        ];

        if (str_contains($media_url, '.mov') || str_contains($media_url, '.mp4')) {
            $payload['video_url'] = $media_url;
            $payload['media_type'] = 'VIDEO';
        } else {
            $payload['media_type'] = 'IMAGE';
            $payload['image_url'] = $media_url;
        }


        $endpoint = 'https://graph.threads.net/v25.0/'.$userPostSystem->userToken->user_token_id.'/threads';

        $containerCreationResponse = Http::withToken($userPostSystem->userToken->access_token)
            ->post($endpoint, $payload);

        if (isset($payload['user_tags']) && array_key_exists('error', $containerCreationResponse->json() ?? [])) {
            unset($payload['user_tags']);
            $containerCreationResponse = Http::withToken($userPostSystem->userToken->access_token)
                ->post($endpoint, $payload);
        }

        $containerId = $containerCreationResponse->json()['id'] ?? null;

        $postCreationResponse = Http::withToken($userPostSystem->userToken->access_token)->post('https://graph.threads.net/v25.0/'.$userPostSystem->userToken->user_token_id.'/threads_publish?creation_id='.$containerId);

        if (array_key_exists('error', $postCreationResponse->json())) {
            Sleep::for(20)->second();
            $attempts = 0;
            while ($attempts < 10) {
                $postCreationResponse = Http::withToken($userPostSystem->userToken->access_token)->post('https://graph.threads.net/v25.0/'.$userPostSystem->userToken->user_token_id.'/threads_publish?creation_id='.$containerId);
                if (! array_key_exists('error', $postCreationResponse->json())) {
                    break;
                }
                $attempts++;
            }

            if ($attempts > 10) {
                throw new Exception('Failed to upload media after 10 attempts');
            }
        }

        $responseId = $postCreationResponse->json()['id'] ?? throw new Exception('Failed to post to threads.');

        UserPostSystem::query()->where('id', $userPostSystem->id)->update(['created_post_Id' => $responseId]);
    }

    /**
     * @throws ConnectionException
     */
    public function refreshToken(UserToken $userToken): void
    {
        $response = Http::get('https://graph.threads.net/refresh_access_token', [
            'grant_type' => 'th_refresh_token',
            'refresh_token' => $userToken->access_token,
        ]);

        if ($this->requiresReauth($userToken, $response)) {
            return;
        }

        $user = $response->json();

        $userToken->update([
            'access_token' => $user['access_token'],
            'expires_at' => Date::now()->addSeconds($user['expires_in']),
        ]);
    }

    public function getPostMetrics(UserPostSystem $userPostSystem)
    {
        $mediaUploadResponse = Http::withToken($userPostSystem->userToken->access_token)->get('https://graph.threads.net/'.$userPostSystem->created_post_Id.'/insights',
            [
                'metric' => 'likes,replies,views',
            ])->json();

        if (array_key_exists('error', $mediaUploadResponse)) {
            return;
        }

        dd($mediaUploadResponse);
        $likeCount = (int) $mediaUploadResponse['data'][0]['values'][0]['value'];
        $impressionCount = (int) $mediaUploadResponse['data'][2]['values'][0]['value'];
        $replyCount = (int) $mediaUploadResponse['data'][1]['values'][0]['value'];

        PostMetric::create([
            'likes' => $userPostSystem->likes ?? 0,
            'replies' => $userPostSystem->replies ?? 0,
            'impressions' => $userPostSystem->impressions ?? 0,
            'user_post_system_id' => $userPostSystem->id,
        ]);

        UserPostSystem::find($userPostSystem->id)->update([
            'likes' => $likeCount,
            'replies' => $replyCount,
            'impressions' => $impressionCount,
        ]);

    }

    public function createBotPost(UserToken $userToken, string $content)
    {
        // TODO: Implement createBotPost() method.
    }
}
