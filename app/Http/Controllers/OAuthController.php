<?php

namespace App\Http\Controllers;

use App\Jobs\TokenRefresh;
use App\Models\System;
use App\Models\UserToken;
use App\Services\FacebookService;
use App\Services\InstagramService;
use App\Services\LinkedInService;
use App\Services\XService;
use Http;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request as HttpRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Date;
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

    /**
     * @throws ConnectionException
     */
    public function callback(string $platform)
    {
        Cache::delete(auth()->id().'-connectedSystem');

        $system = System::query()->where('url_slug', $platform)->firstOrFail();
        $user = Socialite::driver($platform)->user();
        switch ($platform) {
            case 'x':
                $userToken = UserToken::where(['system_id' => $system->id, 'user_token_id' => $user->id])->first();
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

                $tokenWithSystem = UserToken::with('system')->find($userToken->id);
                TokenRefresh::dispatch($tokenWithSystem)->delay(Date::now()->addSeconds($user->expiresIn - 60));
                break;
            case 'instagram':

                $longLivedToken = Http::get('https://graph.instagram.com/access_token', [
                    'grant_type' => 'ig_exchange_token',
                    'client_secret' => env('INSTAGRAM_CLIENT_SECRET'),
                    'access_token' => $user->token,
                ])->json();

                $userToken = UserToken::where(['system_id' => $system->id, 'user_token_id' => $user->id])->first();

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

                $tokenWithSystem = UserToken::with('system')->find($userToken->id);
                TokenRefresh::dispatch($tokenWithSystem)->delay(Date::now()->addDays(55));
                break;
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

                return redirect('accounts')->with('pagesToSelect', $pagesToSelect);
                break;
            case 'linkedin-openid':

                $userToken = UserToken::where(['system_id' => $system->id, 'user_token_id' => $user->id])->first();

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

                $tokenWithSystem = UserToken::with('system')->find($userToken->id);
                TokenRefresh::dispatch($tokenWithSystem)->delay(Date::now()->addDays(55));
                break;
            default:
                break;
        }

        return redirect('accounts');
    }

    public function finishAccountCreation(HttpRequest $request) {
        $request->validate([
            'id' => 'string',
            'name' => 'string',
            'system_id' => 'integer',
            'access_token' => 'string',
        ]);

        $userToken = UserToken::where(
            ['system_id' => $request->input('system_id'),
            'user_token_id' => $request->input('id')])->first();

        if ($userToken != null) {
            $userToken->update([
                'access_token' => $request->input('access_token'),
                'refresh_token' => $request->input('refresh_token') ?? '',
                'expires_at' => null,
            ]);
        } else {
            $userToken = UserToken::create([
                'system_id' => $request->input('system_id'),
                'user_name' => $request->input('name'),
                'user_token_id' => $request->input('id'),
                'user_id' => auth()->id(),
                'access_token' => $request->input('access_token'),
                'refresh_token' => '',
                'expires_at' => null,
            ]);
        }

        $tokenWithSystem = UserToken::with('system')->find($userToken->id);
        TokenRefresh::dispatch($tokenWithSystem)->delay(Date::now()->addDays(55));

        return redirect('accounts');

    }

    public function refreshToken(UserToken $userToken, XService $xService, InstagramService $instagramService, LinkedInService $linkedInService, FacebookService $facebookService)
    {
        Cache::delete(auth()->id().'-connectedSystem');

        $system = System::query()->where('id', $userToken->system_id)->firstOrFail();

        switch ($system->url_slug) {
            case 'x':
                $xService->refreshToken($userToken);
                break;
            case 'instagram':
                $instagramService->refreshToken($userToken);
                break;
            case 'facebook':
                //$facebookService->refreshToken($userToken);
                break;
            case 'linkedin-openid':
                $linkedInService->refreshToken($userToken);
                break;
            default:
                break;
        }
    }
}
