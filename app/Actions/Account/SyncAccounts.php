<?php

namespace App\Actions\Account;

use App\Models\ConnectedAccount;
use App\Models\System;
use App\Models\User;
use App\Models\UserPost;
use App\Services\ZernioClient;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;

class SyncAccounts
{
    public function __construct(private readonly ZernioClient $zernio) {}

    /**
     * @throws RequestException
     * @throws ConnectionException
     */
    public function handle(User $user): void
    {
        if ($user->zernio_profile_id === null) {
            return;
        }

        $remote = $this->zernio->accounts($user->zernio_profile_id);
        $systemIds = System::query()->pluck('id', 'url_slug');
        $seen = [];

        foreach ($remote as $account) {
            $systemId = $systemIds[$account['platform']] ?? null;

            if ($systemId === null) {
                continue;
            }

            ConnectedAccount::updateOrCreate(
                ['zernio_account_id' => $account['_id']],
                [
                    'user_id' => $user->id,
                    'system_id' => $systemId,
                    'username' => $account['username'] ?? null,
                    'display_name' => $account['displayName'] ?? null,
                    'disconnected_at' => ($account['isActive'] ?? true) ? null : now(),
                ],
            );

            $seen[] = $account['_id'];
        }

        $connectedAccountsToDelete = ConnectedAccount::query()
            ->where('user_id', $user->id)
            ->whereNotIn('zernio_account_id', $seen);

        UserPost::whereHas('UserPostSystems', function($query) use ($connectedAccountsToDelete) {
            $query->whereIn('connected_account_id', $connectedAccountsToDelete->pluck('id'));
        })->where('user_id', $user->id)
            ->has('UserPostSystems', '=', 1)
            ->delete();

        $connectedAccountsToDelete->delete();

        Cache::delete($user->id.'-connectedSystem');
        Cache::delete('systems-for-bot-posting');
        Cache::delete($user->id.'-connectedSystems-for-bot-posting');
    }
}
