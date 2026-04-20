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
        return Socialite::driver($platform)->scopes(['tweet.write', 'offline.access'])->redirect();
    }

    public function callback(string $platform)
    {
        $system = System::query()->where('url_slug', $platform)->firstOrFail();
        $user = Socialite::driver($platform)->user();
        if ($system) {
            UserToken::create([
                'system_id' => $system->id,
                'user_id' => auth()->id(),
                'access_token' => $user->token,
                'refresh_token' => $user->refreshToken,
            ]);
        }

        return redirect('accounts');
        // $user->token
    }
}
