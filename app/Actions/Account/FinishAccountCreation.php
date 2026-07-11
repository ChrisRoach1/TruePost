<?php

namespace App\Actions\Account;

use App\Jobs\TokenRefresh;
use App\Models\UserToken;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Date;

class FinishAccountCreation
{
    public function handle(array $data): void
    {
        Cache::delete(auth()->id().'-connectedSystem');

        $userToken = UserToken::where(['system_id' => $data['system_id'], 'user_token_id' => $data['id']])->first();

        if ($userToken != null) {
            $userToken->update([
                'access_token' => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? '',
                'expires_at' => null,
            ]);
        } else {
            $userToken = UserToken::create([
                'system_id' => $data['system_id'],
                'user_name' => $data['name'],
                'user_token_id' => $data['id'],
                'user_id' => auth()->id(),
                'access_token' => $data['access_token'],
                'refresh_token' => '',
                'expires_at' => null,
            ]);
        }

        $tokenWithSystem = UserToken::with('system')->find($userToken->id);
        TokenRefresh::dispatch($tokenWithSystem)->delay(Date::now()->addDays(55));
    }
}
