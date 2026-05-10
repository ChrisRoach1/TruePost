<?php

namespace App\Jobs;

use App\Models\UserPost;
use App\Services\InstagramService;
use App\Services\LinkedInService;
use App\Services\XService;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\SerializesModels;

#[Tries(1)]
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
     *
     * @throws Exception
     */
    public function handle(XService $xService, InstagramService $instagramService, LinkedInService $linkedinService): void
    {
        foreach ($this->userPost->UserPostSystems as $platform) {
            switch ($platform->userToken->System->url_slug) {
                case 'instagram':
                    try {
                        $instagramService->createPost($platform, $this->userPost->original_content, $this->userPost->media_url);
                    } catch (Exception $e) {
                        $platform->update(['failed_to_post' => true]);
                    }
                    break;
                case 'x':
                    try {
                        $xService->createPost($platform, $this->userPost->original_content, $this->userPost->media_url);
                    } catch (Exception $e) {
                        $platform->update(['failed_to_post' => true]);
                    }
                    break;
                case 'linkedin-openid':
                    try {
                        $linkedinService->createPost($platform, $this->userPost->original_content, $this->userPost->media_url);
                    } catch (Exception $e) {
                        $platform->update(['failed_to_post' => true]);
                    }
                    break;
                default:
                    throw new Exception('Unsupported platform: '.$platform->userToken->System->url_slug);
            }
        }
    }
}
