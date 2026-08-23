<?php

namespace App\Http\Controllers;

use App\Actions\Bot\CreateBot;
use App\Actions\Bot\UpdateBot;
use App\Models\BotPost;
use App\Models\ConnectedAccount;
use App\Models\System;
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
            return ConnectedAccount::query()->where('user_id', auth()->id())->whereNull('disconnected_at')->with(['system' => function ($query) {
                $query->where('image_required', false);
            }])->get();
        });

        return Inertia::render('create-bot', [
            'connectedAccounts' => $connectedAccounts,
            'systems' => $systems,
        ]);
    }

    public function list(Request $request)
    {
        $systems = Cache::remember('systems-for-bot-posting', 6000, function () {
            return System::where(['image_required' => false])->orderBy('id')->get();
        });

        $connectedAccounts = Cache::remember(auth()->id().'-connectedSystems-for-bot-posting', 6000, function () {
            return ConnectedAccount::query()->where('user_id', auth()->id())->whereNull('disconnected_at')->with(['system' => function ($query) {
                $query->where('image_required', false);
            }])->get();
        });

        $bots = BotPost::query()->where(['user_id' => auth()->id()])
            ->with(['BotPostSystems:id,bot_post_id,connected_account_id', 'BotPostSystems.ConnectedAccount:id,system_id,username', 'BotPostSystems.ConnectedAccount.System:id,name,icon,background_color,order'])
            ->select(['id', 'bot_description', 'post_times', 'next_post_at'])->get();

        return Inertia::render('bots', [
            'connectedAccounts' => $connectedAccounts,
            'systems' => $systems,
            'bots' => $bots,
        ]);
    }

    public function store(Request $request, CreateBot $createBot)
    {
        $validated = $request->validate([
            'description' => 'nullable|string',
            'connectedAccountIds' => 'required|array',
            'times' => 'required|array',
        ]);

        $createBot->handle($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Bot Created Successfully!')])->render('create-bot');

        return redirect()->route('create.bot');
    }

    public function update(Request $request, BotPost $botPost, UpdateBot $updateBot)
    {
        abort_unless($botPost->user_id == auth()->id(), 403);

        $validated = $request->validate([
            'description' => 'nullable|string',
            'connectedAccountIds' => 'required|array',
            'times' => 'required|array',
        ]);

        $updateBot->handle($botPost, $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Bot Updated Successfully!')])->render('bots');

        return redirect()->route('bots.list');
    }

    public function delete(BotPost $botPost)
    {
        abort_unless($botPost->user_id == auth()->id(), 403);

        $botPost->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Bot Deleted Successfully!')])->render('bots');

        return redirect()->route('bots.list');
    }
}
