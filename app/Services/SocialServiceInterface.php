<?php

namespace App\Services;

use App\Models\UserPostSystem;
use App\Models\UserToken;

interface SocialServiceInterface
{
    public function getPosts();

    public function createPost(UserPostSystem $userPostSystem, string $content, ?string $media = null);

    public function refreshToken(UserToken $userToken);

    public function getPostMetrics(UserPostSystem $userPostSystem);
}
