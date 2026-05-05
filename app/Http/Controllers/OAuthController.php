<?php

namespace App\Http\Controllers;

use App\Jobs\TokenRefresh;
use App\Models\System;
use App\Models\UserToken;
use Laravel\Socialite\Facades\Socialite;

class OAuthController extends Controller
{
    /**
     * Redirect user to a correct platform.
     */
    public function redirect(string $platform)
    {
        $system = System::query()->where('url_slug', $platform)->firstOrFail();

        return Socialite::driver($platform)->scopes($system->scopes)->redirect();
    }

    public function callback(string $platform)
    {
        $system = System::query()->where('url_slug', $platform)->firstOrFail();
        $user = Socialite::driver($platform)->user();

        switch ($platform) {
            case 'x':
                $userToken = UserToken::create([
                    'system_id' => $system->id,
                    'user_name' => $user->nickname,
                    'user_token_id' => $user->id,
                    'user_id' => auth()->id(),
                    'access_token' => $user->token,
                    'refresh_token' => $user->refreshToken,
                    'expires_at' => \Date::now()->addSeconds($user->expiresIn),
                ]);

                $tokenWithSystem = UserToken::with('system')->find($userToken->id);
                TokenRefresh::dispatch($tokenWithSystem)->delay(\Date::now()->addSeconds($user->expiresIn - 60));
                break;
            case 'instagram':

                $longLivedToken = \Http::get('https://graph.instagram.com/access_token',[
                        'grant_type' => 'ig_exchange_token',
                        'client_secret' => env('INSTAGRAM_CLIENT_SECRET'),
                        'access_token' => $user->token,
                    ])
                    ->json();

                $userToken = UserToken::create([
                    'system_id' => $system->id,
                    'user_name' => $user->user['username'],
                    'user_token_id' => $user->id,
                    'user_id' => auth()->id(),
                    'access_token' => $longLivedToken['access_token'],
                    'refresh_token' => $user->refreshToken ?? '',
                    'expires_at' => \Date::now()->addSeconds($longLivedToken['expires_in']),
                ]);

                $tokenWithSystem = UserToken::with('system')->find($userToken->id);
                TokenRefresh::dispatch($tokenWithSystem)->delay(\Date::now()->addDays(55));
                break;
            case 'facebook':
                UserToken::create([
                    'system_id' => $system->id,
                    'user_name' => $user->user['name'],
                    'user_token_id' => $user->id,
                    'user_id' => auth()->id(),
                    'access_token' => $user->token,
                    'refresh_token' => $user->refreshToken ?? '',
                ]);
                break;
            case 'linkedin-openid':
                UserToken::create([
                    'system_id' => $system->id,
                    'user_name' => $user->user['name'],
                    'user_token_id' => $user->id,
                    'user_id' => auth()->id(),
                    'access_token' => $user->token,
                    'refresh_token' => $user->refreshToken ?? '',
                ]);
                break;
            default:
                break;
        }
        if ($system) {

        }

        return redirect('accounts');
        // $user->token
    }
}
