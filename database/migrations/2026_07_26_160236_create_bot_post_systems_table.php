<?php

use App\Models\BotPost;
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
        Schema::create('bot_post_systems', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(BotPost::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(UserToken::class)->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bot_post_systems');
    }
};
