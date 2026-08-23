<?php

namespace App\Actions\Subscription;

use App\Models\User;
use App\Services\ZernioClient;
use Illuminate\Support\Facades\Cache;

class ApplySoloKeepList
{
    public const string SESSION_ACCOUNT_IDS = 'solo_keep_account_ids';

    public const string SESSION_BOT_IDS = 'solo_keep_bot_ids';

    public function __construct(private readonly ZernioClient $zernio) {}

    /**
     * @param  list<int>|null  $keepAccountIds
     * @param  list<int>|null  $keepBotIds
     */
    public function handle(User $user, ?array $keepAccountIds, ?array $keepBotIds): void
    {
        if ($keepBotIds !== null) {
            $user->BotPosts()
                ->whereNotIn('id', $keepBotIds)
                ->get()
                ->each(fn ($bot) => $bot->delete());
        }

        if ($keepAccountIds !== null) {
            $accounts = $user->ConnectedAccount()
                ->whereNotIn('id', $keepAccountIds)
                ->get();

            foreach ($accounts as $account) {
                $this->zernio->disconnectAccount($account->zernio_account_id);
                $account->delete();
            }
        }

        Cache::delete($user->id.'-connectedSystem');
        Cache::delete($user->id.'-connectedSystems-for-bot-posting');
    }
}
