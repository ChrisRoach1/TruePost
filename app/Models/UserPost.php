<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'content', 'post_at', 'job_id'])]
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

    public function UserPostAttachments(): HasMany
    {
        return $this->hasMany(UserPostAttachment::class);
    }
}
