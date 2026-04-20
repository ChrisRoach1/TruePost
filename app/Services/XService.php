<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class XService
{
    public function createPost(string $authtoken, string $content): void
    {
        $response = Http::withToken($authtoken)->post('https://api.x.com/2/tweets',
            [
                'text' => $content,
            ]);


    }

    public function createPostWithMedia() {}
}
