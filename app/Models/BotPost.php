<?php

namespace App\Models;

use DateTimeZone;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

#[Fillable(['user_id', 'bot_description', 'post_times', 'next_post_at', 'current_time_index'])]
class BotPost extends Model
{
    protected $casts = [
        'post_times' => 'array',
    ];

    public function User(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function BotPostSystems(): HasMany
    {
        return $this->hasMany(BotPostSystem::class);
    }

    /**
     * @throws \DateInvalidTimeZoneException
     */
    public function computeNextPostAt()
    {
        $user = $this->User()->firstOrFail();
        $userTz = new DateTimeZone($user->timezone);
        $now = Carbon::now($userTz);

        $next = collect($this->post_times)
            ->map(fn (string $time) => Carbon::parse($time, $userTz))
            ->filter(fn (Carbon $candidate) => $candidate->isAfter($now))
            ->sort()
            ->first();

        $next ??= Carbon::parse(collect($this->post_times)->sort()->first(), $userTz)->addDay();

        $this->update(['next_post_at' => $next->utc()]);
        $this->save();
    }
}
