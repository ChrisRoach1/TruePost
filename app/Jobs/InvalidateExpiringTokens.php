<?php

namespace App\Jobs;

use App\Models\UserToken;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class InvalidateExpiringTokens implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $tokens = UserToken::whereBetween('refresh_expires_at', Carbon::tomorrow())->get();
        foreach ($tokens as $token) {
            $token->update(['refresh_token_expires_at' => null, 'needs_reauthed' => true]);
            $token->save();
        }

    }
}
