<?php

namespace App\Jobs;

use App\Models\UserPost;
use App\Models\UserToken;
use App\Services\XService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;

class SendPosts implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(public UserPost $userPost)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(XService $xService): void
    {
        $userTokens = UserToken::where('user_id', $this->userPost->user_id)->get();
        $xToken = $userTokens->where('system_id', 1)->first();
        $xService->createPost($xToken->access_token, $this->userPost->content);
    }
}
