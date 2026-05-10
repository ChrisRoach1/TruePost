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
     * @throws \Exception
     */
    public function handle(XService $xService, InstagramService $instagramService, LinkedInService $linkedinService): void
    {
        foreach ($this->userPost->UserPostSystems as $platform) {
            switch ($platform->userToken->System->url_slug) {
                case 'instagram':
                    $instagramService->createPost($platform, $this->userPost->original_content, $this->userPost->media_url);
                    break;
                case 'x':
                    $xService->createPost($platform, $this->userPost->original_content, $this->userPost->media_url);
                    break;
                case 'linkedin-openid':
                    $linkedinService->createPost($platform, $this->userPost->original_content, $this->userPost->media_url);
                    break;
                default:
                    throw new \Exception('Unsupported platform: '.$platform->userToken->System->url_slug);
            }
        }
    }
}
