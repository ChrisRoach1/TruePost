<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['zernio_account_id', 'user_id', 'system_id', 'username', 'display_name', 'disconnected_at'])]
class ConnectedAccount extends Model
{
    public function User(): BelongsTo
    {
        return $this->BelongsTo(User::class);
    }

    public function System(): BelongsTo
    {
        return $this->BelongsTo(System::class);
    }
}
