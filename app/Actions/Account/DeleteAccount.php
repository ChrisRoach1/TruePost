<?php

namespace App\Actions\Account;

use App\Models\ConnectedAccount;
use App\Models\UserPost;
use App\Models\UserPostSystem;
use Illuminate\Support\Facades\Cache;

class DeleteAccount
{
    public function handle(ConnectedAccount $connectedAccount): void
    {
        $connectedAccount->delete();

        $postIds = UserPostSystem::query()->where('connected_account_id', $connectedAccount->id)->get()->pluck('user_post_id');

        UserPost::query()->whereIn('id', $postIds)->delete();

        Cache::delete(auth()->id().'-connectedSystem');
    }
}
