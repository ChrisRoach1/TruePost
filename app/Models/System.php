<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name'])]
class System extends Model
{
    //

    public function UserToken(): HasMany
    {
        return $this->hasMany(UserToken::class);
    }
}
