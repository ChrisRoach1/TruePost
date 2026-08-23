<?php

use App\Jobs\MetricCalculations;
use App\Jobs\ProcessBotPosts;

Schedule::job(new ProcessBotPosts)->everyMinute()->name('process_bot_posts');

Schedule::job(new MetricCalculations)->everySixHours();

// Disabled while SendPosts is stubbed. The sweep claims due posts by setting
// dispatched_at and nothing ever retries a claimed post, so leaving it on would
// permanently strand every post that came due before Zernio publishing lands.
// Re-enable with: Schedule::job(new App\Jobs\SendDuePosts)->everyMinute();
