<?php

namespace App\Jobs;

use App\Ai\Agents\GenerateBasePost;
use App\Models\BotPost;
use App\Models\BotPostHistory;
use App\Services\ZernioClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessBotPosts implements ShouldQueue
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
     * @throws \DateInvalidTimeZoneException
     */
    public function handle(ZernioClient $zernioClient): void
    {
        $botPosts = BotPost::query()
            ->where('next_post_at', '<=', now())
            ->with(['BotPostSystems' => function ($query) {
                $query->whereHas('ConnectedAccount.System', fn ($q) => $q->where('can_botpost', true))
                    ->with('ConnectedAccount.System');
            }])
            ->get();

        foreach ($botPosts as $botPost) {

            $postHistory = BotPostHistory::where(['bot_post_id' => $botPost->id])
                ->orderByDesc('created_at')
                ->take(10)
                ->pluck('post_text')->toArray();

            foreach ($botPost->BotPostSystems as $platform) {

                $content = new GenerateBasePost($botPost->bot_description, $postHistory)
                    ->prompt('please generate a post fit for posting on '.$platform->ConnectedAccount->System->name.' and it must be under this character limit: '.$platform->ConnectedAccount->System->max_post_length);

                BotPostHistory::create(['bot_post_id' => $botPost->id, 'post_text' => $content]);

                try {
                    $id = $zernioClient->sendPost($platform->ConnectedAccount->System->url_slug, $platform->ConnectedAccount->zernio_account_id, $content, '');
                } catch (\Exception $ex) {
                    \Log::error('failed to post bot post with error: '.$ex->getMessage());
                }
            }

            $botPost->computeNextPostAt();
        }
    }
}
