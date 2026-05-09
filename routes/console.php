<?php

use App\Jobs\InvalidateExpiringTokens;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->everyMinute();

Schedule::job(new InvalidateExpiringTokens)->daily();
