<?php

namespace App\Actions\UserPost;

use App\Jobs\SendPosts;
use App\Models\UserPost;
use DateTime;
use DateTimeZone;

class PostNow
{
    /**
     * @throws \DateInvalidTimeZoneException
     * @throws \DateMalformedStringException
     */
    public function handle(UserPost $userPost)
    {
        $userTz = new DateTimeZone(auth()->user()->getTimezone());
        $postDate = new DateTime(now($userTz));
        $userPostWithData = UserPost::with('UserPostSystems.connectedAccount.system')->find($userPost->id);

        SendPosts::dispatch($userPostWithData);

        // Claiming the post is what cancels the pending scheduled send, since
        // SendDuePosts only picks up rows that have not been dispatched.
        $userPost->update(['post_at' => $postDate, 'dispatched_at' => now(), 'has_posted' => true]);
    }
}
