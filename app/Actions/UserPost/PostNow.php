<?php

namespace App\Actions\UserPost;

use App\Jobs\SendPosts;
use App\Models\UserPost;
use DateTime;
use DateTimeZone;
use Illuminate\Support\Facades\DB;

class PostNow
{
    /**
     * @throws \DateInvalidTimeZoneException
     * @throws \DateMalformedStringException
     */
    public function handle(UserPost $userPost)
    {
        if ($userPost->job_id) {
            DB::table('jobs')->where('id', $userPost->job_id)->delete();
        }

        $userTz = new DateTimeZone(auth()->user()->getTimezone());
        $postDate = new DateTime(now($userTz));
        $userPostWithData = UserPost::with('UserPostSystems.userToken.system')->find($userPost->id);

        SendPosts::dispatch($userPostWithData);

        $userPost->update(['post_at' => $postDate, 'job_id' => null, 'has_posted' => true]);
    }
}
