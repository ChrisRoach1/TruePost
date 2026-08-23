<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\BotController;
use App\Http\Controllers\UserPostController;
use App\Http\Controllers\ZernioWebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::post('webhooks/zernio', ZernioWebhookController::class)->name('webhooks.zernio');

Route::get('privacy', function () {
    return view('privacy');
})->name('privacy');

Route::middleware(['auth', 'verified'])->group(function () {
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

    Route::get('/solosubscription-checkout', function (Request $request) {
        return $request->user()
            ->newSubscription('solo', env('SOLO_STRIPE_PRICE_ID'))
            ->trialDays(7)
            ->checkout([
                'success_url' => route('create'),
                'cancel_url' => route('create'),
            ]);
    })->name('solo-subscription.checkout');

    Route::post('/solo-subscription-cancel', function (Request $request) {
        $subscription = $request->user()->subscription('solo');

        if ($subscription === null || $subscription->canceled()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Your subscription is already cancelled.')]);

            return to_route('profile.edit');
        }

        $subscription->cancel();
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Subscription cancelled. Solo stays active until the end of your billing period.')]);

        return to_route('profile.edit');

    })->name('solo-subscription.cancel');

    Route::get('/pro-subscription-checkout', function (Request $request) {
        return $request->user()
            ->newSubscription('pro', env('PRO_STRIPE_PRICE_ID'))
            ->trialDays(7)
            ->checkout([
                'success_url' => route('create'),
                'cancel_url' => route('create'),
            ]);
    })->name('pro-subscription.checkout');

    Route::post('/pro-subscription-cancel', function (Request $request) {
        $subscription = $request->user()->subscription('pro');

        if ($subscription === null || $subscription->canceled()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Your subscription is already cancelled.')]);

            return to_route('profile.edit');
        }

        $subscription->cancel();
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Subscription cancelled. Pro stays active until the end of your billing period.')]);

        return to_route('profile.edit');

    })->name('pro-subscription.cancel');

});

require __DIR__.'/settings.php';
