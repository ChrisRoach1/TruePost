<?php

use App\Jobs\InvalidateExpiringTokens;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->everyMinute();

Schedule::job(new InvalidateExpiringTokens)->everyMinute();

Schedule::job(new \App\Jobs\MetricCalculations())->everySecond();

Artisan::command('test_metric_calculation', function () {
    \App\Jobs\MetricCalculations::dispatch();
});
