<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserPostController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::delete('accounts/{userToken}', [AccountController::class, 'delete'])->name('accounts.delete');
    Route::get('accounts', [AccountController::class, 'index'])->name('accounts');
    Route::get('auth/{platform}/redirect', [AccountController::class, 'redirect'])->name('oauth.redirect');
    Route::get('auth/{platform}/callback', [AccountController::class, 'callback'])->name('oauth.callback');
    Route::post('auth/{userToken}/refresh', [AccountController::class, 'refreshToken'])->name('oauth.refreshToken');
    Route::post('auth/finishAccountCreation', [AccountController::class, 'finishAccountCreation'])->name('oauth.finishAccountCreation');

    Route::get('userPost', [UserPostController::class, 'index'])->name('userPost.index');
    Route::post('userPost', [UserPostController::class, 'store'])->name('userPost.store');
    Route::post('userPost/refreshMetrics', [UserPostController::class, 'refreshMetrics'])->name('userPost.metrics-refresh');
    Route::put('userPost/{userPost}', [UserPostController::class, 'update'])->name('userPost.update');
    Route::delete('userPost/{userPost}', [UserPostController::class, 'delete'])->name('userPost.delete');
    Route::post('userPost/{userPost}/postNow', [UserPostController::class, 'postNow'])->name('userPost.postNow');
});

require __DIR__.'/settings.php';
