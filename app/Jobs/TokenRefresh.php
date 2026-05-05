<?php

namespace App\Jobs;

use App\Models\UserToken;
use App\Services\InstagramService;
use App\Services\XService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;

class TokenRefresh implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(public UserToken $userToken)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(XService $xService, InstagramService $instagramService): void
    {
        if ($this->userToken == null) {
            return;
        }

        switch ($this->userToken->System->url_slug) {
            case 'x':
                $xService->refreshToken($this->userToken);
                break;
            case 'instagram':
                $instagramService->refreshToken($this->userToken);
                break;
        }
    }
}
