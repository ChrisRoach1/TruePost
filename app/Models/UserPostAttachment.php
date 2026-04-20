<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_post_id', 'attachment_path', 'attachment_type', 'attachment_name', 'attachment_size'])]
class UserPostAttachment extends Model
{
    public function UserPost(): BelongsTo
    {
        return $this->belongsTo(UserPost::class);
    }
}
