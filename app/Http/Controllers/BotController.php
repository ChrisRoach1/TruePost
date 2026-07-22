<?php

namespace App\Http\Controllers;

use App\Actions\UserPost\CreateUserPost;
use App\Actions\UserPost\UpdateUserPost;
use App\Models\System;
use App\Models\UserPost;
use App\Models\UserToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class BotController extends Controller
{
    public function index(Request $request)
    {
        $systems = Cache::remember('systems', 6000, function () {
            return System::where(['image_required' => false])->orderBy('id')->get();
        });

        $connectedAccounts = Cache::remember(auth()->id().'-connectedSystem', 6000, function () {
            return UserToken::query()->where(['needs_reauthed' => false, 'user_id' => auth()->id()])->with('system')->get();
        });

        return Inertia::render('ai-bots', [
            'connectedAccounts' => $connectedAccounts,
            'systems' => $systems,
        ]);
    }

    public function store(Request $request, CreateUserPost $createUserPost) {}

    public function update(Request $request, UserPost $userPost, UpdateUserPost $updateUserPost) {}

    public function delete(UserPost $userPost) {}
}
