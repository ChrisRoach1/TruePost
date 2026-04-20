<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['user_token_id', 'user_post_id'])]
class UserPostSystem extends Model
{
    public function UserPost(): BelongsTo
    {
        return $this->belongsTo(UserPost::class);
    }

    public function userToken(): belongsTo
    {
        return $this->belongsTo(UserToken::class);
    }
}
