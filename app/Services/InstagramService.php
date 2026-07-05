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

class InstagramService implements ISocialService
{
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
            'caption' => $content,
            'image_url' => $media_url,
        ];

        $collaborators = array_values(array_filter($userPostSystem->collaborators ?? []));
        if (! empty($collaborators)) {
            $payload['collaborators'] = json_encode($collaborators);
        }

        $usersToTag = array_values(array_unique(array_merge(
            array_filter($userPostSystem->tags ?? []),
            $collaborators,
        )));

        if (! empty($usersToTag)) {
            $userTags = [];
            foreach ($usersToTag as $index => $username) {
                $userTags[] = [
                    'username' => $username,
                    // Images require x/y coordinates (0-1). Spread tags vertically so no two
                    // tags share the same point, which Instagram rejects.
                    'x' => 0.5,
                    'y' => round(min(0.9, 0.1 + ($index * 0.15)), 2),
                ];
            }
            $payload['user_tags'] = json_encode($userTags);
        }

        $endpoint = 'https://graph.instagram.com/v25.0/'.$userPostSystem->userToken->user_token_id.'/media';

        $containerCreationResponse = Http::withToken($userPostSystem->userToken->access_token)
            ->post($endpoint, $payload);

        if (isset($payload['user_tags']) && array_key_exists('error', $containerCreationResponse->json() ?? [])) {
            unset($payload['user_tags']);
            $containerCreationResponse = Http::withToken($userPostSystem->userToken->access_token)
                ->post($endpoint, $payload);
        }

        $containerId = $containerCreationResponse->json()['id'] ?? null;

        $postCreationResponse = Http::withToken($userPostSystem->userToken->access_token)->post('https://graph.instagram.com/v25.0/'.$userPostSystem->userToken->user_token_id.'/media_publish?creation_id='.$containerId);

        if (array_key_exists('error', $postCreationResponse->json())) {
            $attempts = 0;
            while ($attempts < 10) {
                $postCreationResponse = Http::withToken($userPostSystem->userToken->access_token)->post('https://graph.instagram.com/v25.0/'.$userPostSystem->userToken->user_token_id.'/media_publish?creation_id='.$containerId);
                if (! array_key_exists('error', $postCreationResponse->json())) {
                    break;
                }
                $attempts++;
            }

            if ($attempts > 10) {
                throw new Exception('Failed to upload media after 10 attempts');
            }
        }

        $responseId = $postCreationResponse->json()['id'] ?? null;

        UserPostSystem::query()->where('id', $userPostSystem->id)->update(['created_post_Id' => $responseId]);
    }

    /**
     * @throws ConnectionException
     */
    public function refreshToken(UserToken $userToken): void
    {
        $response = Http::get('https://graph.instagram.com/refresh_access_token', [
            'grant_type' => 'ig_refresh_token',
            'refresh_token' => $userToken->access_token,
            'client_id' => env('X_CLIENT_ID'),
        ]);

        $user = $response->json();

        $userToken->update([
            'access_token' => $user['access_token'],
            'expires_at' => Date::now()->addSeconds($user['expires_in']),
        ]);

        TokenRefresh::dispatch($userToken)->delay(Date::now()->addDays(55));
    }

    public function getPostMetrics(UserPostSystem $userPostSystem)
    {
        $mediaUploadResponse = Http::withToken($userPostSystem->userToken->access_token)->get('https://graph.instagram.com/'.$userPostSystem->created_post_Id.'/insights',
            [
                'metric' => 'likes,comments,views',
            ])->json();

        if (array_key_exists('error', $mediaUploadResponse)) {
            return;
        }

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
}
