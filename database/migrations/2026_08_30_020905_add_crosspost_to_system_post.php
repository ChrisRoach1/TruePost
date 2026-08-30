<?php

use Database\Seeders\SystemSeeder;
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
        Schema::table('user_post_systems', function (Blueprint $table) {
            $table->json('crosspost_list')->nullable(true);
            $table->json('crosspost_ids')->nullable(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('system_post', function (Blueprint $table) {
            //
        });
    }
};
