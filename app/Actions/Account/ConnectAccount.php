<?php

namespace App\Actions\Account;

use App\Exceptions\AccountLimitReached;
use App\Models\System;
use App\Models\UserToken;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Http;
use Laravel\Socialite\Facades\Socialite;

class ConnectAccount
{
    public function handle(string $platform): ?array
    {
        Cache::delete(auth()->id().'-connectedSystem');
        Cache::delete('systems-for-bot-posting');
        Cache::delete(auth()->id().'-connectedSystems-for-bot-posting');

        $system = System::query()->where('url_slug', $platform)->firstOrFail();
        $user = Socialite::driver($platform)->user();
        switch ($platform) {
            case 'x':
                $userToken = UserToken::where(['system_id' => $system->id, 'user_token_id' => $user->id, 'user_id' => auth()->id()])->first();
                $this->guardAccountLimit($userToken);

                if ($userToken != null) {
                    $userToken->update([
                        'access_token' => $user->token,
                        'refresh_token' => $user->refreshToken,
                        'expires_at' => Date::now()->addSeconds($user->expiresIn),
                    ]);
                } else {
                    $userToken = UserToken::create([
                        'system_id' => $system->id,
                        'user_name' => $user->nickname,
                        'user_token_id' => $user->id,
                        'user_id' => auth()->id(),
                        'access_token' => $user->token,
                        'refresh_token' => $user->refreshToken,
                        'expires_at' => Date::now()->addSeconds($user->expiresIn),
                    ]);
                }

                return null;

            case 'instagram':

                $longLivedToken = Http::get('https://graph.instagram.com/access_token', [
                    'grant_type' => 'ig_exchange_token',
                    'client_secret' => env('INSTAGRAM_CLIENT_SECRET'),
                    'access_token' => $user->token,
                ])->json();

                $userToken = UserToken::where(['system_id' => $system->id, 'user_token_id' => $user->id])->first();
                $this->guardAccountLimit($userToken);

                if ($userToken != null) {
                    $userToken->update([
                        'access_token' => $longLivedToken['access_token'],
                        'refresh_token' => $user->refreshToken ?? '',
                        'expires_at' => Date::now()->addSeconds($longLivedToken['expires_in']),
                    ]);
                } else {
                    $userToken = UserToken::create([
                        'system_id' => $system->id,
                        'user_name' => $user->user['username'],
                        'user_token_id' => $user->id,
                        'user_id' => auth()->id(),
                        'access_token' => $longLivedToken['access_token'],
                        'refresh_token' => $user->refreshToken ?? '',
                        'expires_at' => Date::now()->addSeconds($longLivedToken['expires_in']),
                    ]);
                }

                return null;

            case 'facebook':

                $longLivedToken = Http::get('https://graph.facebook.com/v25.0/oauth/access_token', [
                    'grant_type' => 'fb_exchange_token',
                    'client_id' => env('FACEBOOK_CLIENT_ID'),
                    'client_secret' => env('FACEBOOK_CLIENT_SECRET'),
                    'fb_exchange_token' => $user->token,
                ])->json();

                $pages = Http::get('https://graph.facebook.com/v25.0/me/accounts', [
                    'access_token' => $user->token,
                ])->json();

                $pagesToSelect = [];

                if (array_key_exists('data', $pages)) {
                    foreach ($pages['data'] as $page) {
                        array_push($pagesToSelect, [
                            'id' => $page['id'],
                            'name' => $page['name'],
                            'access_token' => $page['access_token'],
                            'system_id' => $system->id,
                        ]);
                    }
                }

                return $pagesToSelect;
                break;
            case 'linkedin-openid':

                $userToken = UserToken::where(['system_id' => $system->id, 'user_token_id' => $user->id])->first();
                $this->guardAccountLimit($userToken);

                if ($userToken != null) {
                    $userToken->update([
                        'access_token' => $user->token,
                        'refresh_token' => $user->refreshToken ?? '',
                        'expires_at' => Date::now()->addSeconds($user->expiresIn),
                    ]);
                } else {
                    $userToken = UserToken::create([
                        'system_id' => $system->id,
                        'user_name' => $user->user['name'],
                        'user_token_id' => $user->id,
                        'user_id' => auth()->id(),
                        'access_token' => $user->token,
                        'refresh_token' => $user->refreshToken ?? '',
                        'expires_at' => Date::now()->addSeconds($user->expiresIn),
                    ]);
                }

                return null;

            default:
                break;
        }
    }

    /**
     * Re-authing an account the user already has is always allowed; only a
     * brand new token counts against the free plan limit.
     *
     * @throws AccountLimitReached
     */
    private function guardAccountLimit(?UserToken $existingToken): void
    {
        if ($existingToken === null && auth()->user()->hasReachedAccountLimit()) {
            throw new AccountLimitReached;
        }
    }
}
