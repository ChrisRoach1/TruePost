<?php

use App\Jobs\InvalidateExpiringTokens;
use App\Jobs\MetricCalculations;
use App\Jobs\ProcessBotPosts;

Schedule::job(new InvalidateExpiringTokens)->everyMinute();

Schedule::job(new ProcessBotPosts)->everyMinute();

Schedule::job(new MetricCalculations)->everySixHours();
