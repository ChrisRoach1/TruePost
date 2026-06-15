<?php

namespace App\Jobs;

use App\Models\UserPost;
use App\Services\InstagramService;
use App\Services\XService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Queue\Queueable;

class MetricCalculations implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(public ?int $userId = null)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(XService $xService, InstagramService $instagramService): void
    {

        UserPost::query()->with('UserPostSystems.UserToken.System')->when($this->userId, function (Builder $query, $userId) {
            $query->where(['user_id' => $userId]);
        })->get()->each(function ($post) use ($xService, $instagramService) {
            foreach ($post->UserPostSystems as $systemPost) {
                switch ($systemPost->userToken->System->url_slug) {
                    case 'instagram':
                        $instagramService->getPostMetrics($systemPost);
                        break;
                    case 'x':
                        $xService->getPostMetrics($systemPost);
                        break;
                    case 'linkedin-openid':
                        // $linkedinService->createPost($systemPost->userToken->access_token, $this->userPost->original_content, $systemPost->userToken->user_token_id, $this->userPost->media_url);
                        break;
                    default:
                        throw new \Exception('Unsupported platform: '.$systemPost->userToken->System->url_slug);
                }
            }
        });
    }
}
