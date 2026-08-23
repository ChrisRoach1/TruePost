<?php

namespace App\Jobs;

use App\Models\PostMetric;
use App\Models\UserPost;
use App\Models\UserPostSystem;
use App\Services\ZernioClient;
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

    public function handle(ZernioClient $zernioClient): void
    {

        UserPost::query()->where('created_at', '>=', \Illuminate\Support\now()->subDays(30))
            ->with('UserPostSystems.ConnectedAccount.System')->when($this->userId, function (Builder $query, $userId) {
            $query->where(['user_id' => $userId]);
        })->get()->each(function ($post) use ($zernioClient) {
            foreach ($post->UserPostSystems as $systemPost) {

                if (! empty($systemPost->created_post_Id)){
                    $metrics = $zernioClient->getPostAnalytics($systemPost->created_post_Id);

                    if (! empty($metrics)) {
                        PostMetric::create([
                            'likes' => $systemPost->likes ?? 0,
                            'replies' => $systemPost->replies ?? 0,
                            'impressions' => $systemPost->impressions ?? 0,
                            'user_post_system_id' => $systemPost->id,
                        ]);

                        UserPostSystem::find($systemPost->id)->update([
                            'likes' => $metrics[1],
                            'replies' => $metrics[2],
                            'impressions' => $metrics[0],
                        ]);
                    }
                }

            }
        });
    }
}
