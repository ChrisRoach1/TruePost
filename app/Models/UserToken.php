<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['user_id', 'system_id', 'access_token', 'refresh_token'])]
class UserToken extends Model
{

    public function User(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function System(): belongsTo
    {
        return $this->belongsTo(System::class);
    }

}
