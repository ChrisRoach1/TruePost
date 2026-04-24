<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'user_name', 'system_id', 'access_token', 'refresh_token', 'user_token_id'])]
class UserToken extends Model
{
    public function User(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function System(): BelongsTo
    {
        return $this->belongsTo(System::class);
    }
}
