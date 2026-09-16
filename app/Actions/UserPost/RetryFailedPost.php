<?php

namespace App\Actions\UserPost;

use App\Jobs\SendPosts;
use App\Models\UserPost;

class RetryFailedPost
{
    /**
     * @throws \DateInvalidTimeZoneException
     * @throws \DateMalformedStringException
     */
    public function handle(UserPost $userPost)
    {
        $userPostWithData = UserPost::with(['UserPostSystems' => function ($query) {
            $query->where('failed_to_post', true);
        }, 'UserPostSystems.ConnectedAccount.System'])->find($userPost->id);

        if ($userPostWithData->UserPostSystems->count() > 0) {
            SendPosts::dispatch($userPostWithData);
        }

    }
}
