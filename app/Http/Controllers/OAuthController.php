<?php

namespace App\Http\Controllers;

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
                UserToken::create([
                    'system_id' => $system->id,
                    'user_name' => $user->nickname,
                    'user_token_id' => $user->id,
                    'user_id' => auth()->id(),
                    'access_token' => $user->token,
                    'refresh_token' => $user->refreshToken,
                ]);
                break;
            case 'instagram':
                UserToken::create([
                    'system_id' => $system->id,
                    'user_name' => $user->user['username'],
                    'user_token_id' => $user->id,
                    'user_id' => auth()->id(),
                    'access_token' => $user->token,
                    'refresh_token' => $user->refreshToken ?? '',
                ]);
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
            default:
                break;
        }
        if ($system) {

        }

        return redirect('accounts');
        // $user->token
    }
}
