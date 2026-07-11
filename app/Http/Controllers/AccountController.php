<?php

namespace App\Http\Controllers;

use App\Actions\Account\ConnectAccount;
use App\Actions\Account\DeleteAccount;
use App\Actions\Account\FinishAccountCreation;
use App\Actions\Account\ManuallyRefreshToken;
use App\Models\System;
use App\Models\UserToken;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Http\Request as HttpRequest;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $connectedAccounts = Cache::remember(auth()->id().'-connectedSystem', 6000, function () {
            return UserToken::query()->where(['needs_reauthed' => false, 'user_id' => auth()->id()])->with('system')->get();
        });

        $systems = Cache::remember('systems', 6000, function () {
            return System::query()->orderBy('id')->get();
        });

        return Inertia::render('accounts', [
            'connectedAccounts' => $connectedAccounts,
            'systems' => $systems,
        ]);
    }

    public function delete(UserToken $userToken, DeleteAccount $deleteAccount)
    {
        $deleteAccount->handle($userToken);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Account deleted successfully!')])->render('accounts');

        return redirect()->route('accounts');
    }

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
    public function callback(string $platform, ConnectAccount $connectAccount)
    {
        $profilesToChoose = $connectAccount->handle($platform);

        return redirect('accounts')->with('pagesToSelect', $profilesToChoose);


    }

    public function finishAccountCreation(HttpRequest $request, FinishAccountCreation $finishAccountCreation)
    {
        $validated = $request->validate([
            'id' => 'string',
            'name' => 'string',
            'system_id' => 'integer',
            'access_token' => 'string',
        ]);

        $finishAccountCreation->handle($validated);

        return redirect('accounts');

    }

    public function refreshToken(UserToken $userToken, ManuallyRefreshToken $manuallyRefreshToken)
    {
        $manuallyRefreshToken->handle($userToken);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Account refreshed successfully!')])->render('accounts');

        return redirect()->route('accounts');
    }
}
