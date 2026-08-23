<?php

namespace App\Actions\Account;

use App\Models\System;
use App\Models\User;
use App\Services\ZernioClient;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;

class StartConnection
{
    public function __construct(
        private readonly ZernioClient $zernio,
        private readonly EnsureZernioProfile $ensureProfile,
    ) {}

    /**
     * @throws RequestException
     * @throws ConnectionException
     */
    public function handle(User $user, System $system): string
    {
        return $this->zernio->connectUrl(
            platform: $system->url_slug,
            profileId: $this->ensureProfile->handle($user),
            redirectUrl: route('oauth.callback', ['platform' => $system->url_slug]),
        );
    }
}
