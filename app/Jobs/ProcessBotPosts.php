<?php

namespace App\Jobs;

use App\Models\BotPost;
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
            foreach ($botPost->BotPostSystems as $platform) {

                // need AI agent to generate text
                $content = 'test post';

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
