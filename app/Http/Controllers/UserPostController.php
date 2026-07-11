<?php

namespace App\Http\Controllers;

use App\Actions\UserPost\CreateUserPost;
use App\Actions\UserPost\PostNow;
use App\Actions\UserPost\UpdateUserPost;
use App\Jobs\MetricCalculations;
use App\Models\System;
use App\Models\UserPost;
use App\Models\UserToken;
use DB;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserPostController extends Controller
{
    public function index(Request $request)
    {

        $searchQuery = $request->query('search');

        $userPosts = UserPost::query()
            ->with('UserPostSystems.userToken.system')
            ->where('user_id', auth()->id())
            ->when($searchQuery, function (Builder $query, $searchQuery) {
                $query->where('original_content', 'like', '%'.$searchQuery.'%');
            })
            ->orderBy('id', 'desc')
            ->get();

        $connectedAccounts = UserToken::query()
            ->where(['needs_reauthed' => false])
            ->where('user_id', auth()->id())
            ->with('system')
            ->get();

        $systems = System::query()->orderBy('id')->get();

        return Inertia::render('posts', [
            'userPosts' => $userPosts,
            'connectedAccounts' => $connectedAccounts,
            'systems' => $systems,
        ]);
    }

    /**
     * @throws \DateMalformedStringException
     * @throws \DateInvalidTimeZoneException
     */
    public function store(Request $request, CreateUserPost $createUserPost)
    {
        $validated = $request->validate([
            'content' => 'nullable|string',
            'is_draft' => 'required|boolean',
            'channelContent' => 'nullable|array',
            'collaborators' => 'nullable|array',
            'collaborators.*' => 'array|max:5',
            'collaborators.*.*' => 'string',
            'tags' => 'nullable|array',
            'tags.*' => 'array|max:5',
            'tags.*.*' => 'string',
            'userTokenIds' => 'required|array',
            'image' => 'nullable|image',
            'is_scheduled' => 'required|boolean',
            'scheduled_date_string' => 'nullable|string',
            'scheduled_time' => 'nullable|string',
        ]);

        $createUserPost->handle($validated, $request->file('image'));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Post Scheduled!')])->render('dashboard');

        return redirect()->route('dashboard');
    }

    /**
     * @throws \DateMalformedStringException
     * @throws \DateInvalidTimeZoneException
     */
    public function update(Request $request, UserPost $userPost, UpdateUserPost $updateUserPost)
    {
        abort_unless($userPost->user_id === auth()->id() && $userPost->is_draft, 403);

        $validated = $request->validate([
            'content' => 'nullable|string',
            'is_draft' => 'required|boolean',
            'channelContent' => 'nullable|array',
            'collaborators' => 'nullable|array',
            'collaborators.*' => 'array|max:5',
            'collaborators.*.*' => 'string',
            'tags' => 'nullable|array',
            'tags.*' => 'array|max:5',
            'tags.*.*' => 'string',
            'userTokenIds' => 'required|array',
            'image' => 'nullable|image',
            'is_scheduled' => 'required|boolean',
            'scheduled_date_string' => 'nullable|string',
            'scheduled_time' => 'nullable|string',
        ]);

        $updateUserPost->handle($userPost, $validated, $request->file('image'));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Post Updated!')])->render('posts');

        return redirect()->route('userPost.index');
    }

    public function delete(UserPost $userPost)
    {
        abort_unless($userPost->user_id === auth()->id(), 403);

        $userPost->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Post deleted!')])->render('posts');

        return redirect()->route('userPost.index');
    }

    /**
     * @throws \DateInvalidTimeZoneException
     * @throws \DateMalformedStringException
     */
    public function postNow(UserPost $userPost, PostNow $postNow)
    {
        abort_unless($userPost->user_id === auth()->id(), 403);

        $postNow->handle($userPost);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Posted!')])->render('posts');

        return redirect()->route('userPost.index');
    }

    public function refreshMetrics(Request $request)
    {
        MetricCalculations::dispatch(auth()->id());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Metrics are refreshing!')])->render('posts');

        return redirect()->route('userPost.index');

    }
}
