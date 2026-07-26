<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
}
