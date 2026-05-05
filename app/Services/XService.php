<?php

namespace App\Services;

use App\Jobs\TokenRefresh;
use App\Models\UserToken;
use Illuminate\Support\Facades\Http;

class XService implements SocialServiceInterface
{
    public function createPost(string $authToken, string $content, ?string $user_token_id = null, ?string $media = null): void
    {

        if ($media != null) {
            $file = \Storage::disk('r2')->get($media);

            $mediaUploadResponse = Http::withToken($authToken)->attach('media', $file, 'media.jpg')->post('https://api.x.com/2/media/upload',
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
                    $uploadStatusResponse = Http::withToken($authToken)->get('https://api.x.com/2/media/upload', ['media_id' => $mediaID]);
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

            $response = Http::withToken($authToken)->post('https://api.x.com/2/tweets',
                [
                    'text' => $content,
                    'media' => [
                        'media_ids' => [$mediaID],
                    ],
                    'made_with_ai' => false,
                ]);

        } else {
            $response = Http::withToken($authToken)->post('https://api.x.com/2/tweets',
                [
                    'text' => $content,
                ]);

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
}
