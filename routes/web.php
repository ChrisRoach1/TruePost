<?php

use App\Http\Controllers\OAuthController;
use App\Http\Controllers\UserPostController;
use App\Models\System;
use App\Models\UserPost;
use App\Models\UserPostSystem;
use App\Models\UserToken;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', function () {

        $connectedAccounts = UserToken::query()->where(['needs_reauthed' => false])->with('system')->get();
        $systems = System::query()->orderBy('id')->get();
        $upNextItems = UserPost::query()
            ->with('UserPostSystems.userToken.System')
            ->where(['user_id' => auth()->id(), 'has_posted' => false, 'is_draft' => false])
            ->orderBy('post_at', 'desc')
            ->get()->map(function (UserPost $userPost) {
                $systems = [];
                foreach ($userPost->UserPostSystems as $postSystem) {
                    array_push($systems, $postSystem->userToken->System);
                }

                return [
                    'id' => $userPost->id,
                    'time' => $userPost->post_at,
                    'channels' => $systems,
                    'hasImage' => $userPost->media_url ?? true,
                    'content' => $userPost->original_content,
                ];
            });

        $recentlyPublished = UserPost::query()
            ->with('UserPostSystems.userToken.System')
            ->where(['user_id' => auth()->id(), 'has_posted' => true])
            ->orderBy('post_at', 'desc')
            ->take(4)
            ->get()->map(function (UserPost $userPost) {
                $systems = [];
                foreach ($userPost->UserPostSystems as $postSystem) {
                    array_push($systems, [
                        'system' => $postSystem->userToken->System,
                        'reach' => 'up',
                        'likes' => 1000,
                        'replies' => 1000,
                    ]);
                }

                return [
                    'id' => $userPost->id,
                    'time' => $userPost->post_at,
                    'metrics' => $systems,
                    'content' => $userPost->original_content,
                ];
            });

        return Inertia::render('dashboard', [
            'connectedAccounts' => $connectedAccounts,
            'systems' => $systems,
            'upNextItems' => $upNextItems,
            'recentlyPublishedItems' => $recentlyPublished,
        ]);
    })->name('dashboard');

    Route::get('accounts', function () {
        $connectedAccounts = UserToken::query()
            ->where('user_id', auth()->id())
            ->get(['id', 'system_id', 'user_name']);
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

    Route::get('userPost', [UserPostController::class, 'index'])->name('userPost.index');
    Route::post('userPost', [UserPostController::class, 'store'])->name('userPost.store');
    Route::put('userPost/{userPost}', [UserPostController::class, 'update'])->name('userPost.update');
    Route::delete('userPost/{userPost}', [UserPostController::class, 'delete'])->name('userPost.delete');
    Route::post('userPost/{userPost}/postNow', [UserPostController::class, 'postNow'])->name('userPost.postNow');
});

require __DIR__.'/settings.php';
