<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_post_system_id', 'impressions', 'likes', 'replies'])]
class PostMetric extends Model
{
    //
}
