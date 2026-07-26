<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['bot_post_id', 'user_token_id'])]

class BotPostSystem extends Model
{

    public function BotPost(): BelongsTo
    {
        return $this->belongsTo(BotPost::class);
    }

    public function UserToken(): HasOne
    {
        return $this->hasOne(UserToken::class);
    }
}

