<?php

namespace App\Http\Controllers;

use App\Actions\Account\ConnectAccount;
use App\Actions\Account\DeleteAccount;
use App\Actions\Account\FinishAccountCreation;
use App\Actions\Account\ManuallyRefreshToken;
use App\Exceptions\AccountLimitReached;
use App\Models\System;
use App\Models\User;
use App\Models\UserToken;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Http\Request as HttpRequest;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;

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
    public function redirect(Request $request, string $platform)
    {
        $system = System::query()->where('url_slug', $platform)->firstOrFail();

        $alreadyOnPlatform = UserToken::query()
            ->where(['user_id' => $request->user()->id, 'system_id' => $system->id])
            ->exists();

        if (! $alreadyOnPlatform && $request->user()->hasReachedAccountLimit()) {
            return $this->accountLimitReached();
        }

        return Socialite::driver($platform)->scopes($system->scopes)->redirect();
    }

    /**
     * @throws ConnectionException
     */
    public function callback(string $platform, ConnectAccount $connectAccount)
    {
        try {
            $profilesToChoose = $connectAccount->handle($platform);
        } catch (AccountLimitReached) {
            return $this->accountLimitReached();
        } catch (InvalidStateException) {
            return $this->connectionAttemptExpired();
        }

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

        try {
            $finishAccountCreation->handle($validated);
        } catch (AccountLimitReached) {
            return $this->accountLimitReached();
        }

        return redirect('accounts');

    }

    public function refreshToken(UserToken $userToken, ManuallyRefreshToken $manuallyRefreshToken)
    {
        $manuallyRefreshToken->handle($userToken);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Account refreshed successfully!')])->render('accounts');

        return redirect()->route('accounts');
    }

    /**
     * Socialite consumes the OAuth state on first use, so a replayed or
     * overlapping callback lands here even though the original attempt worked.
     */
    private function connectionAttemptExpired()
    {
        Inertia::flash('toast', [
            'type' => 'error',
            'message' => __('That connection attempt expired. Check the list below, and try connecting again if the account is missing.'),
        ])->render('accounts');

        return redirect()->route('accounts');
    }

    private function accountLimitReached()
    {
        Inertia::flash('toast', [
            'type' => 'error',
            'message' => __('Free plans are limited to :limit connected accounts. Upgrade to Pro to connect more.', [
                'limit' => User::FREE_ACCOUNT_LIMIT,
            ]),
        ])->render('accounts');

        return redirect()->route('accounts');
    }
}
