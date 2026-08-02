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

        $botPost->BotPostSystems()->whereNotIn('user_token_id', $data['userTokenIds'])->delete();

        $existing = $botPost->BotPostSystems()->get()->keyBy('user_token_id');

        foreach ($data['userTokenIds'] as $userTokenId) {
            if (! $existing->has($userTokenId)) {
                $botPost->BotPostSystems()->create([
                    'user_token_id' => $userTokenId,
                ]);
            }
        }

        $botPost->computeNextPostAt();
        $botPost->save();

        return $botPost;
    }
}
