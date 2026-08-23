<?php

namespace App\Actions\Bot;

use App\Models\BotPost;
use DateTimeZone;

class CreateBot
{
    public function __construct() {}

    /**
     * @throws \DateInvalidTimeZoneException
     * @throws \DateMalformedStringException
     */
    public function handle(array $data): BotPost
    {
        $userTz = new DateTimeZone(auth()->user()->getTimezone());

        $botPost = BotPost::create([
            'bot_description' => $data['description'],
            'user_id' => auth()->id(),
            'post_times' => $data['times'],
        ]);
        foreach ($data['connectedAccountIds'] as $connectedAccountId) {
            $botPost->BotPostSystems()->create([
                'connected_account_id' => $connectedAccountId,
            ]);
        }

        $botPost->computeNextPostAt();
        $botPost->save();

        return $botPost;
    }
}
