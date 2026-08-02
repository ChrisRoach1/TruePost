<?php

namespace App\Jobs;

use App\Ai\Agents\GenerateBasePost;
use App\Models\BotPost;
use App\Models\BotPostHistory;
use App\Services\FacebookService;
use App\Services\LinkedInService;
use App\Services\XService;
use Exception;
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
     * Execute the job.
     *
     * @throws Exception
     */
    public function handle(XService $xService, LinkedInService $linkedinService, FacebookService $facebookService): void
    {
        $botPosts = BotPost::query()
            ->where('next_post_at', '<=', now())
            ->with('BotPostSystems.UserToken.System')
            ->get();

        foreach ($botPosts as $botPost) {

            $postHistory = BotPostHistory::where(['bot_post_id' => $botPost->id])->pluck('post_text')->toArray();

            foreach ($botPost->BotPostSystems as $platform) {

                $content = (new GenerateBasePost($botPost->bot_description, $postHistory))->prompt('please generate a post fit for posting on '.$platform->UserToken->System->name.' and it must be under this character limit: '.$platform->UserToken->System->max_post_length);

                BotPostHistory::create(['bot_post_id' => $botPost->id, 'post_text' => $content]);

                switch ($platform->UserToken->System->url_slug) {
                    case 'x':
                        try {
                            $xService->createBotPost($platform->UserToken, $content);
                        } catch (Exception $ex) {
                            \Log::error($ex->getMessage());
                        }
                        break;
                    case 'linkedin-openid':
                        try {
                            $linkedinService->createBotPost($platform->UserToken, $content);
                        } catch (Exception $ex) {
                            \Log::error($ex->getMessage());
                        }
                        break;
                    case 'facebook':
                        try {
                            $facebookService->createBotPost($platform->UserToken, $content);
                        } catch (Exception $ex) {
                            \Log::error($ex->getMessage());
                        }
                        break;
                    default:
                        throw new Exception('Unsupported platform: '.$platform->UserToken->System->url_slug);
                }
            }

            $botPost->computeNextPostAt();
        }
    }
}
