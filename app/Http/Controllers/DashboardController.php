<?php

namespace App\Http\Controllers;

use App\Jobs\MetricCalculations;
use App\Jobs\SendPosts;
use App\Models\System;
use App\Models\UserPost;
use App\Models\UserToken;
use DateTime;
use DateTimeZone;
use DB;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Intervention\Image\Laravel\Facades\Image;

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
            'upNextItems' => $upNextItems,
            'recentlyPublishedItems' => $recentlyPublished,
        ]);
    }

}
