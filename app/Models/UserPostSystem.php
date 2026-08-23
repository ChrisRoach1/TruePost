<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['connected_account_id', 'user_post_id', 'override_content', 'collaborators', 'tags', 'failed_to_post', 'likes', 'replies', 'impressions', 'created_post_Id'])]
class UserPostSystem extends Model
{
    protected function casts(): array
    {
        return [
            'collaborators' => 'array',
            'tags' => 'array',
        ];
    }

    public function UserPost(): BelongsTo
    {
        return $this->belongsTo(UserPost::class);
    }

    public function ConnectedAccount(): BelongsTo
    {
        return $this->belongsTo(ConnectedAccount::class);
    }
}
