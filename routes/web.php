<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\BotController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\UserPostController;
use App\Http\Controllers\ZernioWebhookController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::match(['GET', 'HEAD', 'POST'], '/webhooks/zernio', ZernioWebhookController::class)->name('webhooks.zernio');

Route::get('privacy', function () {
    return view('privacy');
})->name('privacy');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/solosubscription-checkout', [SubscriptionController::class, 'checkoutSolo'])
        ->name('solo-subscription.checkout');
    Route::post('/solosubscription-checkout', [SubscriptionController::class, 'checkoutSolo'])
        ->name('solo-subscription.downgrade');
    Route::get('/solo-subscription-success', [SubscriptionController::class, 'soloSuccess'])
        ->name('solo-subscription.success');

    Route::get('/pro-subscription-checkout', [SubscriptionController::class, 'checkoutPro'])
        ->name('pro-subscription.checkout');
    Route::get('/pro-subscription-success', [SubscriptionController::class, 'proSuccess'])
        ->name('pro-subscription.success');
});

Route::middleware(['auth', 'verified', 'subscribed'])->group(function () {
    Route::delete('accounts/{connectedAccount}', [AccountController::class, 'delete'])->name('accounts.delete');
    Route::get('accounts', [AccountController::class, 'index'])->name('accounts');
    Route::get('auth/{platform}/redirect', [AccountController::class, 'redirect'])->name('oauth.redirect');
    Route::get('auth/{platform}/callback', [AccountController::class, 'callback'])->name('oauth.callback');

    Route::get('create', [UserPostController::class, 'index'])->name('create');
    Route::get('userPost', [UserPostController::class, 'show'])->name('userPost.index');
    Route::post('userPost', [UserPostController::class, 'store'])->name('userPost.store');
    Route::post('userPost/refreshMetrics', [UserPostController::class, 'refreshMetrics'])->name('userPost.metrics-refresh');
    Route::put('userPost/{userPost}', [UserPostController::class, 'update'])->name('userPost.update');
    Route::delete('userPost/{userPost}', [UserPostController::class, 'delete'])->name('userPost.delete');
    Route::post('userPost/{userPost}/postNow', [UserPostController::class, 'postNow'])->name('userPost.postNow');

    Route::get('create-bot', [BotController::class, 'index'])->name('create.bot');
    Route::post('bots', [BotController::class, 'store'])->name('bots.store');
    Route::get('bots', [BotController::class, 'list'])->name('bots.list');
    Route::delete('bots/{botPost}', [BotController::class, 'delete'])->name('bot.delete');
    Route::patch('bots/{botPost}', [BotController::class, 'update'])->name('bot.update');
});

require __DIR__.'/settings.php';
