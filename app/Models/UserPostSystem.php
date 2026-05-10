<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_token_id', 'user_post_id', 'override_content', 'failed_to_post'])]
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
