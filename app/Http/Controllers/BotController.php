<?php

namespace App\Http\Controllers;

use App\Actions\Bot\CreateBot;
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
        $systems = Cache::remember('systems-for-bot-posting', 6000, function () {
            return System::where(['image_required' => false])->orderBy('id')->get();
        });

        $connectedAccounts = Cache::remember(auth()->id().'-connectedSystems-for-bot-posting', 6000, function () {
            return UserToken::query()->where(['needs_reauthed' => false, 'user_id' => auth()->id()])->with(['system' => function($query){
                $query->where('image_required', false);
            }])->get();
        });

        return Inertia::render('ai-bots', [
            'connectedAccounts' => $connectedAccounts,
            'systems' => $systems,
        ]);
    }

    /**
     * @throws \DateMalformedStringException
     * @throws \DateInvalidTimeZoneExceptionuse App\Actions\UserPost\CreateUserPost;
     * use App\Actions\UserPost\UpdateUserPost;
     */
    public function store(Request $request, CreateBot $createBot)
    {
        $validated = $request->validate([
            'description' => 'nullable|string',
            'userTokenIds' => 'required|array',
            'times' => 'required|array',
        ]);

        $createBot->handle($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Bot Created Successfully!')])->render('ai-bots');

        return redirect()->route('bots');
    }

    public function update(Request $request, UserPost $userPost, UpdateUserPost $updateUserPost) {}

    public function delete(UserPost $userPost) {}
}
