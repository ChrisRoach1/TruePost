<?php

namespace App\Jobs;

use App\Models\System;
use App\Models\UserToken;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Queue\Queueable;

class RefreshDueTokens implements ShouldQueue
{
    use Queueable;

    /**
     * How long before expiry each platform's token should be refreshed, in
     * minutes. X issues two hour tokens; Instagram and LinkedIn issue sixty
     * day tokens. Facebook page tokens never expire and so are absent here.
     */
    private const REFRESH_LEAD_TIMES = [
        'x' => 10,
        'instagram' => 7200,
        'linkedin-openid' => 7200,
    ];

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $systemIds = System::query()
            ->whereIn('url_slug', array_keys(self::REFRESH_LEAD_TIMES))
            ->pluck('id', 'url_slug');

        if ($systemIds->isEmpty()) {
            return;
        }

        $tokens = UserToken::query()
            ->where('needs_reauthed', false)
            ->whereNotNull('expires_at')
            ->where(function (Builder $query) use ($systemIds) {
                foreach (self::REFRESH_LEAD_TIMES as $slug => $leadInMinutes) {
                    if (! $systemIds->has($slug)) {
                        continue;
                    }

                    $query->orWhere(function (Builder $query) use ($systemIds, $slug, $leadInMinutes) {
                        $query->where('system_id', $systemIds[$slug])
                            ->where('expires_at', '<=', now()->addMinutes($leadInMinutes));
                    });
                }
            })
            ->with('System')
            ->get();

        foreach ($tokens as $token) {
            TokenRefresh::dispatch($token);
        }
    }
}
