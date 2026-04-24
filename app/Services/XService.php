<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class XService implements SocialServiceInterface
{
    public function createPost(string $authToken, string $content, ?string $user_token_id = null, ?string $media = null): void
    {
        $response = Http::withToken($authToken)->post('https://api.x.com/2/tweets',
            [
                'text' => $content,
            ]);


    }

    public function getPosts()
    {
        // TODO: Implement getPosts() method.
    }
}
