<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class System extends Model
{
    protected $casts = [
        'scopes' => 'array',
    ];

    public function ConnectedAccount(): HasMany
    {
        return $this->hasMany(ConnectedAccount::class);
    }
}
