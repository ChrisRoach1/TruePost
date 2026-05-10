<?php

namespace App\Jobs;

use App\Models\UserPost;
use App\Services\InstagramService;
use App\Services\LinkedInService;
use App\Services\XService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class MetricCalculations implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(XService $xService, InstagramService $instagramService, LinkedInService $linkedinService): void
    {
//        UserPost::query()->with('UserPostSystems.UserToken.System')->whereRaw('CAST(now() AS DATE) <= CAST(created_at AS DATE) + days_to_track_metrics')->get()->each(function ($post) {
//            foreach ($post->UserPostSystems as $systemPost) {
//                switch ($systemPost->userToken->System->url_slug) {
//                    case 'instagram':
//                        $instagramService->createPost($systemPost->userToken->access_token, $this->userPost->original_content, $systemPost->userToken->user_token_id, $this->userPost->media_url);
//                        break;
//                    case 'x':
//                        $xService->createPost($systemPost->userToken->access_token, $this->userPost->original_content, $systemPost->userToken->user_token_id, $this->userPost->media_url);
//                        break;
//                    case 'linkedin-openid':
//                        $linkedinService->createPost($systemPost->userToken->access_token, $this->userPost->original_content, $systemPost->userToken->user_token_id, $this->userPost->media_url);
//                        break;
//                    default:
//                        throw new \Exception('Unsupported platform: '.$systemPost->userToken->System->url_slug);
//                }
//            }
//        });
    }
}
