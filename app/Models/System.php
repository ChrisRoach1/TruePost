<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class System extends Model
{
    protected $casts = [
        'scopes' => 'array',
    ];

    public function UserToken(): HasMany
    {
        return $this->hasMany(UserToken::class);
    }
}
