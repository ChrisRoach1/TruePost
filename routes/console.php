<?php

use App\Jobs\InvalidateExpiringTokens;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Schedule::job(new InvalidateExpiringTokens)->everyMinute();

Schedule::job(new \App\Jobs\MetricCalculations())->everySixHours();
