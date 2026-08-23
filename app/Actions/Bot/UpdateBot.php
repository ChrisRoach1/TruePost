<?php

namespace App\Actions\Bot;

use App\Models\BotPost;
use DateTimeZone;

class UpdateBot
{
    public function __construct() {}

    /**
     * @throws \DateInvalidTimeZoneException
     * @throws \DateMalformedStringException
     */
    public function handle(BotPost $botPost, array $data): BotPost
    {
        $userTz = new DateTimeZone(auth()->user()->getTimezone());

        $botPost->update([
            'bot_description' => $data['description'],
            'post_times' => $data['times'],
        ]);

        $botPost->BotPostSystems()->whereNotIn('connected_account_id', $data['connectedAccountIds'])->delete();

        $existing = $botPost->BotPostSystems()->get()->keyBy('connected_account_id');

        foreach ($data['connectedAccountIds'] as $connectedAccountId) {
            if (! $existing->has($connectedAccountId)) {
                $botPost->BotPostSystems()->create([
                    'connected_account_id' => $connectedAccountId,
                ]);
            }
        }

        $botPost->computeNextPostAt();
        $botPost->save();

        return $botPost;
    }
}
