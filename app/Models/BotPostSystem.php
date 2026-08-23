<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['bot_post_id', 'connected_account_id'])]

class BotPostSystem extends Model
{
    public function BotPost(): BelongsTo
    {
        return $this->belongsTo(BotPost::class);
    }

    public function ConnectedAccount(): BelongsTo
    {
        return $this->BelongsTo(ConnectedAccount::class);
    }
}
