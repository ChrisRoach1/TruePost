<?php

namespace App\Services;

use App\Models\UserToken;

class LinkedInService implements SocialServiceInterface
{
    public function createPost(string $authToken, string $content, ?string $user_token_id = null, ?string $media = null): void
    {
        // TODO: Implement getPosts() method.
    }

    public function getPosts()
    {
        // TODO: Implement getPosts() method.
    }

    public function refreshToken(UserToken $userToken)
    {
        // TODO: Implement refreshToken() method.
    }
}
