<?php

namespace App\Actions\Account;

use App\Models\System;
use App\Models\UserToken;
use App\Services\InstagramService;
use App\Services\LinkedInService;
use App\Services\XService;
use Illuminate\Support\Facades\Cache;

class ManuallyRefreshToken
{

    public function __construct(protected XService $xService, protected InstagramService $instagramService, protected LinkedInService $linkedInService)
    {
    }

    public function handle(UserToken $userToken): void
    {
        Cache::delete(auth()->id() . '-connectedSystem');

        $system = System::query()->where('id', $userToken->system_id)->firstOrFail();

        switch ($system->url_slug) {
            case 'x':
                $this->xService->refreshToken($userToken);
                break;
            case 'instagram':
                $this->instagramService->refreshToken($userToken);
                break;
            case 'linkedin-openid':
                $this->linkedInService->refreshToken($userToken);
                break;
            default:
                break;
        }
    }
}
