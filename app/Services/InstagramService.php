<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class InstagramService implements SocialServiceInterface
{
    public function getPosts()
    {
        // TODO: Implement getPosts() method.
    }

    public function createPost(string $authToken, string $content, ?string $user_token_id = null, ?string $media = null)
    {
        $containerCreationResponse = Http::withToken($authToken)->post('https://graph.instagram.com/v25.0/'.$user_token_id.'/media',
            [
                'image_url' => $media,
            ]);

        $containerId = $containerCreationResponse->json()['id'];

        $postCreationResponse = Http::withToken($authToken)->post('https://graph.instagram.com/v25.0/'.$user_token_id.'/media_publish',
            [
                'id' => $containerId,
            ]);

    }
}
