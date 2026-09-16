<?php

use App\Jobs\MetricCalculations;
use App\Jobs\ProcessBotPosts;
use App\Jobs\SendDuePosts;

Schedule::job(new ProcessBotPosts)->everyMinute()->name('process_bot_posts');

Schedule::job(new MetricCalculations)->everySixHours();

Schedule::job(new SendDuePosts)->everyMinute();
