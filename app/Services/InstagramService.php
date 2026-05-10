<?php

namespace App\Services;

use App\Jobs\TokenRefresh;
use App\Models\UserPostSystem;
use App\Models\UserToken;
use Illuminate\Support\Facades\Http;

class InstagramService implements SocialServiceInterface
{
    public function getPosts()
    {
        // TODO: Implement getPosts() method.
    }

    public function createPost(UserPostSystem $userPostSystem, string $content, ?string $media = null)
    {
        $content = $userPostSystem->override_content ?? $content;
        $media_url = env('R2_PUBLIC_ENDPOINT').'/'.$media;
        $containerCreationResponse = Http::withToken($userPostSystem->userToken->access_token)->post('https://graph.instagram.com/v25.0/'.$userPostSystem->userToken->user_token_id.'/media',
            [
                'caption' => $content,
                'image_url' => $media_url,
            ]);

        $containerId = $containerCreationResponse->json()['id'];

        $postCreationResponse = Http::withToken($userPostSystem->userToken->access_token)->post('https://graph.instagram.com/v25.0/'.$userPostSystem->userToken->user_token_id.'/media_publish?creation_id='.$containerId);
    }

    public function refreshToken(UserToken $userToken)
    {
        $response = Http::get('https://graph.instagram.com/refresh_access_token', [
            'grant_type' => 'ig_refresh_token',
            'refresh_token' => $userToken->access_token,
            'client_id' => env('X_CLIENT_ID'),
        ]);

        $user = $response->json();

        $userToken->update([
            'access_token' => $user['access_token'],
            'expires_at' => \Date::now()->addSeconds($user['expires_in']),
        ]);

        TokenRefresh::dispatch($userToken)->delay(\Date::now()->addDays(55));
    }

    public function getPostMetrics(UserPostSystem $userPostSystem)
    {
        // TODO: Implement getPostMetrics() method.
    }
}
