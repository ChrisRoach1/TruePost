<?php

namespace App\Http\Controllers;

use App\Models\System;
use App\Models\UserPost;
use App\Models\UserToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $systems = Cache::remember('systems', 6000, function () {
            return System::query()->orderBy('id')->get();
        });

        $connectedAccounts = Cache::remember(auth()->id().'-connectedSystem', 6000, function () {
            return UserToken::query()->where(['needs_reauthed' => false, 'user_id' => auth()->id()])->with('system')->get();
        });

        $recentlyPublished = UserPost::query()
            ->with('UserPostSystems.userToken.system')
            ->where(['user_id' => auth()->id(), 'has_posted' => true])
            ->orderBy('post_at', 'desc')
            ->take(4)
            ->get()->map(function (UserPost $userPost) {
                return [
                    'id' => $userPost->id,
                    'time' => $userPost->post_at,
                    'content' => $userPost->original_content,
                    'user_post_systems' => $userPost->UserPostSystems,
                ];
            });

        return Inertia::render('dashboard', [
            'connectedAccounts' => $connectedAccounts,
            'systems' => $systems,
            'recentlyPublishedItems' => $recentlyPublished,
        ]);
    }
}
