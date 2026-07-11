<?php

namespace App\Actions\Account;

use App\Models\UserPost;
use App\Models\UserPostSystem;
use App\Models\UserToken;
use Illuminate\Support\Facades\Cache;

class DeleteAccount
{
    public function handle(UserToken $userToken): void
    {
        $userToken->delete();

        $postIds = UserPostSystem::query()->where('user_token_id', $userToken->id)->get()->pluck('user_post_id');

        UserPost::query()->whereIn('id', $postIds)->delete();

        Cache::delete(auth()->id().'-connectedSystem');
    }
}
