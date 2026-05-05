<?php

namespace App\Services;

use App\Models\UserToken;

interface SocialServiceInterface
{
    public function getPosts();

    public function createPost(string $authToken, string $content, ?string $user_token_id = null, ?string $media = null);

    public function refreshToken(UserToken $userToken);
}
