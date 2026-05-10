<?php

namespace App\Services;

use App\Jobs\TokenRefresh;
use App\Models\UserPostSystem;
use App\Models\UserToken;
use Illuminate\Support\Facades\Http;

class XService implements SocialServiceInterface
{
    public function createPost(UserPostSystem $userPostSystem, string $content, ?string $media = null): void
    {

        if ($media != null) {
            $file = \Storage::disk('r2')->get($media);

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
                    throw new \Exception(
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

        } else {
            $response = Http::withToken($userPostSystem->userToken->access_token)->post('https://api.x.com/2/tweets',
                [
                    'text' => $content,
                ]);

            \Log::info($response->json());

        }

    }

    public function getPosts()
    {
        // TODO: Implement getPosts() method.
    }

    public function refreshToken(UserToken $userToken)
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
            'expires_at' => \Date::now()->addSeconds($user['expires_in']),
        ]);

        TokenRefresh::dispatch($userToken)->delay(\Date::now()->addSeconds($user->expires_in - 60));
    }

    public function getPostMetrics(UserPostSystem $userPostSystem)
    {
        $mediaUploadResponse = Http::withToken($userPostSystem->userToken->access_token)->get('https://api.x.com/2/tweets/${userPostSystem->created_post_Id}',
            [
                'tweet.fields' => 'public_metrics'
            ])->json();

        dd($mediaUploadResponse);
    }
}
