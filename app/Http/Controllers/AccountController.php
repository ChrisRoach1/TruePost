<?php

namespace App\Http\Controllers;

use App\Actions\Account\DeleteAccount;
use App\Actions\Account\StartConnection;
use App\Actions\Account\SyncAccounts;
use App\Models\ConnectedAccount;
use App\Models\System;
use App\Models\User;
use App\Services\ZernioClient;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $connectedAccounts = Cache::remember(auth()->id().'-all-connectedSystem', 6000, function () {
            return ConnectedAccount::query()->where(['user_id' => auth()->id()])->with('system')->get();
        });

        $systems = Cache::remember('systems', 6000, function () {
            return System::query()->orderBy('id')->get();
        });

        return Inertia::render('accounts', [
            'connectedAccounts' => $connectedAccounts,
            'systems' => $systems,
        ]);
    }

    public function delete(ConnectedAccount $connectedAccount, DeleteAccount $deleteAccount, ZernioClient $zernioClient)
    {
        $deleteAccount->handle($connectedAccount);
        $zernioClient->disconnectAccount($connectedAccount->zernio_account_id);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Account deleted successfully!')])->render('accounts');

        return redirect()->route('accounts');
    }

    /**
     * Redirect user to a correct platform.
     */
    public function redirect(Request $request, string $platform, StartConnection $startConnection)
    {
        $system = System::query()->where('url_slug', $platform)->firstOrFail();
        $alreadyOnPlatform = ConnectedAccount::query()
            ->where(['user_id' => $request->user()->id, 'system_id' => $system->id])
            ->exists();

        if (! $alreadyOnPlatform && $request->user()->isProMember() && $request->user()->hasReachedProAccountLimit()) {
            return $this->proAccountLimitReached();
        }

        if (! $alreadyOnPlatform && ! $request->user()->isProMember() && $request->user()->isSoloMember() && $request->user()->hasReachedSoloAccountLimit()) {
            return $this->soloAccountLimitReached();
        }

        return redirect()->away($startConnection->handle($request->user(), $system));
    }

    /**
     * @throws ConnectionException
     * @throws RequestException
     */
    public function callback(Request $request, string $platform, SyncAccounts $syncAccounts)
    {
        if ($request->has('error')) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('That connection was cancelled or denied. Nothing was changed.'),
            ])->render('accounts');

            return redirect()->route('accounts');
        }
        $syncAccounts->handle($request->user());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Account connected!'),
        ])->render('accounts');

        return redirect()->route('accounts');
    }

    private function proAccountLimitReached()
    {
        Inertia::flash('toast', [
            'type' => 'error',
            'message' => __('Pro plans are limited to :limit connected accounts.', [
                'limit' => User::PRO_ACCOUNT_LIMIT,
            ]),
        ])->render('accounts');

        return redirect()->route('accounts');
    }

    private function soloAccountLimitReached()
    {
        Inertia::flash('toast', [
            'type' => 'error',
            'message' => __('Solo plans are limited to :limit connected accounts. Upgrade to Pro to connect more.', [
                'limit' => User::SOLO_ACCOUNT_LIMIT,
            ]),
        ])->render('accounts');

        return redirect()->route('accounts');
    }
}
