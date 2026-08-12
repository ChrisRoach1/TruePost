<?php

namespace App\Jobs;

use App\Models\UserPost;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendDuePosts implements ShouldQueue
{
    use Queueable;

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $duePostIds = UserPost::query()
            ->where('is_draft', false)
            ->where('has_posted', false)
            ->whereNull('dispatched_at')
            ->whereNotNull('post_at')
            ->where('post_at', '<=', now())
            ->pluck('id');

        foreach ($duePostIds as $postId) {
            // SendPosts can outlive the sweep interval, so claim the row before
            // dispatching. The conditional update makes the claim atomic, which
            // keeps an overlapping sweep from posting the same content twice.
            $claimed = UserPost::query()
                ->whereKey($postId)
                ->whereNull('dispatched_at')
                ->update(['dispatched_at' => now()]);

            if ($claimed !== 1) {
                continue;
            }

            SendPosts::dispatch(
                UserPost::with('UserPostSystems.userToken.system')->find($postId)
            );
        }
    }
}
