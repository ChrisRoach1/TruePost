<?php

use App\Models\System;
use App\Models\User;
use App\Models\UserPost;
use App\Models\UserToken;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_post_systems', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(UserPost::class);
            $table->foreignIdFor(UserToken::class);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_post_systems');
    }
};
