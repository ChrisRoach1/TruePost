<?php

use App\Http\Controllers\OAuthController;
use App\Http\Controllers\UserPostController;
use App\Models\System;
use App\Models\UserPost;
use App\Models\UserPostSystem;
use App\Models\UserToken;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', function () {
        $connectedAccounts = UserToken::query()->with('system')->get();
        $systems = System::query()->orderBy('id')->get();

        return Inertia::render('dashboard',[
            'connectedAccounts' => $connectedAccounts,
            'systems' => $systems,
        ]);
    })->name('dashboard');

    Route::get('accounts', function () {
        $connectedAccounts = UserToken::query()->get()->select('system_id', 'id');
        $systems = System::query()->orderBy('id')->get();

        return Inertia::render('accounts', [
            'connectedAccounts' => $connectedAccounts,
            'systems' => $systems,
        ]);
    })->name('accounts');

    Route::delete('accounts/{userToken}', function (UserToken $userToken) {
        $userToken->delete();

        $postIds = UserPostSystem::query()->where('user_token_id', $userToken->id)->get()->pluck('user_post_id');

        UserPost::query()->whereIn('id', $postIds)->delete();

        return redirect()->route('accounts')->with('success', 'Account deleted successfully');
    })->name('accounts.delete');

    Route::get('auth/{platform}/redirect', [OAuthController::class, 'redirect'])->name('oauth.redirect');
    Route::get('auth/{platform}/callback', [OAuthController::class, 'callback'])->name('oauth.callback');

    Route::get('userPost', [UserPostController::class, "index"])->name('userPost.index');
    Route::post('userPost', [UserPostController::class, "store"])->name('userPost.store');
});

require __DIR__.'/settings.php';
