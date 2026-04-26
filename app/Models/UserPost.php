<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'post_at', 'job_id', 'media_url', 'original_content'])]
class UserPost extends Model
{
    public function User(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function UserPostSystems(): HasMany
    {
        return $this->hasMany(UserPostSystem::class);
    }
}
