<?php

namespace App\Jobs;

use App\Models\UserPost;
use App\Services\InstagramService;
use App\Services\LinkedInService;
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
    public function handle(XService $xService, InstagramService $instagramService, LinkedInService $linkedinService): void
    {
        foreach ($this->userPost->UserPostSystems as $platform) {
            switch ($platform->userToken->System->url_slug) {
                case 'instagram':
                    $instagramService->createPost($platform->userToken->access_token, $this->userPost->original_content, $platform->userToken->user_token_id, $this->userPost->media_url);
                    break;
                case 'x':
                    $xService->createPost($platform->userToken->access_token, $this->userPost->original_content, $platform->userToken->user_token_id, $this->userPost->media_url);
                    break;
            }
        }
    }
}
