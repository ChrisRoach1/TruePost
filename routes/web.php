<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\BotController;
use App\Http\Controllers\UserPostController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::get('privacy', function () {
    return view('privacy');
})->name('privacy');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('accounts/{userToken}', [AccountController::class, 'delete'])->name('accounts.delete');
    Route::get('accounts', [AccountController::class, 'index'])->name('accounts');
    Route::get('auth/{platform}/redirect', [AccountController::class, 'redirect'])->name('oauth.redirect');
    Route::get('auth/{platform}/callback', [AccountController::class, 'callback'])->name('oauth.callback');
    Route::post('auth/{userToken}/refresh', [AccountController::class, 'refreshToken'])->name('oauth.refreshToken');
    Route::post('auth/finishAccountCreation', [AccountController::class, 'finishAccountCreation'])->name('oauth.finishAccountCreation');

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

    Route::get('/subscription-checkout', function (Request $request) {
        return $request->user()
            ->newSubscription('default', 'price_1U1ZyiEVZMTNj66C3nrUFHKa')
            ->checkout([
                'success_url' => route('create'),
                'cancel_url' => route('create'),
            ]);
    })->name('subscription.checkout');

    Route::post('/subscription-cancel', function (Request $request) {
        $subscription = $request->user()->subscription('default');

        if ($subscription === null || $subscription->canceled()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Your subscription is already cancelled.')]);

            return to_route('profile.edit');
        }

        $subscription->cancel();
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Subscription cancelled. Pro stays active until the end of your billing period.')]);

        return to_route('profile.edit');

    })->name('subscription.cancel');

});

require __DIR__.'/settings.php';
