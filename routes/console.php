<?php

use App\Jobs\InvalidateExpiringTokens;
use App\Jobs\MetricCalculations;
use App\Jobs\ProcessBotPosts;
use App\Jobs\RefreshDueTokens;
use App\Jobs\SendDuePosts;

Schedule::job(new InvalidateExpiringTokens)->everyMinute();

Schedule::job(new ProcessBotPosts)->everyMinute();

Schedule::job(new SendDuePosts)->everyMinute();

Schedule::job(new RefreshDueTokens)->everyFiveMinutes();

Schedule::job(new MetricCalculations)->everySixHours();
