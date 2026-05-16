<?php

use App\Models\User;
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
        Schema::create('user_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(User::class);
            $table->boolean('is_draft')->default(false);
            $table->text('original_content')->nullable(true);
            $table->string('media_url');
            $table->dateTime('post_at')->nullable(true);
            $table->integer('job_id')->nullable(true);
            $table->integer('days_to_track_metrics')->default(15);
            $table->boolean('has_posted')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_posts');
    }
};
