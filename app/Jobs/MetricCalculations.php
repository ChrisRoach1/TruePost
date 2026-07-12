<?php

namespace App\Jobs;

use App\Models\UserPost;
use App\Services\FacebookService;
use App\Services\InstagramService;
use App\Services\LinkedInService;
use App\Services\XService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Http\Client\ConnectionException;

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
     * @throws ConnectionException
     */
    public function handle(XService $xService, InstagramService $instagramService, LinkedInService $linkedInService, FacebookService $facebookService): void
    {

        UserPost::query()->with('UserPostSystems.UserToken.System')->when($this->userId, function (Builder $query, $userId) {
            $query->where(['user_id' => $userId]);
        })->get()->each(function ($post) use ($xService, $instagramService, $linkedInService, $facebookService) {
            foreach ($post->UserPostSystems as $systemPost) {
                switch ($systemPost->userToken->System->url_slug) {
                    case 'instagram':
                        $instagramService->getPostMetrics($systemPost);
                        break;
                    case 'x':
                        $xService->getPostMetrics($systemPost);
                        break;
                    case 'linkedin-openid':
                        $linkedInService->getPostMetrics($systemPost);
                        break;
                    case 'facebook':
                        $facebookService->getPostMetrics($systemPost);
                        break;
                    default:
                        throw new \Exception('Unsupported platform: '.$systemPost->userToken->System->url_slug);
                }
            }
        });
    }
}
