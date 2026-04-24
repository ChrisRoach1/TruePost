<?php

namespace App\Services;

interface SocialServiceInterface
{
    public function getPosts();

    public function createPost(string $authToken, string $content, ?string $user_token_id = null, ?string $media = null);
}
