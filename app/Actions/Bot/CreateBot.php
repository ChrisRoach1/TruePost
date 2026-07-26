<?php

namespace App\Actions\Bot;

use App\Models\BotPost;
use DateTimeZone;
use Illuminate\Support\Carbon;

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

        $nextTime = $this->computeNextPostAt($data['times']);

        $botPost = BotPost::create([
            'bot_description' => $data['description'],
            'user_id' => auth()->id(),
            'post_times' => $data['times'],
            'next_post_at' => $nextTime,
        ]);
        foreach ($data['userTokenIds'] as $userTokenId) {
            $botPost->BotPostSystems()->create([
                'user_token_id' => $userTokenId,
            ]);
        }

        $botPost->save();

        return $botPost;
    }

    /**
     * @throws \DateInvalidTimeZoneException
     */
    private function computeNextPostAt(array $post_times): Carbon
    {
        $userTz = new DateTimeZone(auth()->user()->getTimezone());
        $now = Carbon::now($userTz);

        $next = collect($post_times)
            ->map(fn (string $time) => Carbon::parse($time, $userTz))
            ->filter(fn (Carbon $candidate) => $candidate->isAfter($now))
            ->sort()
            ->first();

        $next ??= Carbon::parse(collect($post_times)->sort()->first(), $userTz)->addDay();

        return $next->utc();
    }
}
