<?php

namespace App\Http\Controllers;

use App\Actions\UserPost\CreateUserPost;
use App\Actions\UserPost\PostNow;
use App\Actions\UserPost\UpdateUserPost;
use App\Jobs\MetricCalculations;
use App\Models\ConnectedAccount;
use App\Models\System;
use App\Models\UserPost;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class UserPostController extends Controller
{
    public function index(Request $request)
    {
        $systems = Cache::remember('systems', 6000, function () {
            return System::query()->orderBy('id')->get();
        });

        $connectedAccounts = Cache::remember(auth()->id().'-connectedSystem', 6000, function () {
            return ConnectedAccount::query()->where(['user_id' => auth()->id()])->with('system')->get();
        });

        $recentlyPublished = UserPost::query()
            ->with('UserPostSystems.connectedAccount.system')
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

        return Inertia::render('create', [
            'connectedAccounts' => $connectedAccounts,
            'systems' => $systems,
            'recentlyPublishedItems' => $recentlyPublished,
        ]);
    }

    public function show(Request $request)
    {

        $searchQuery = $request->query('search');

        $userPosts = UserPost::query()
            ->with('UserPostSystems.connectedAccount.system')
            ->where('user_id', auth()->id())
            ->when($searchQuery, function (Builder $query, $searchQuery) {
                $query->where('original_content', 'like', '%'.$searchQuery.'%');
            })
            ->orderBy('id', 'desc')
            ->get();

        $connectedAccounts = ConnectedAccount::query()
            ->where('user_id', auth()->id())
            ->with('system')
            ->get();

        $systems = Cache::remember('systems', 6000, function () {
            return System::query()->orderBy('id')->get();
        });

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
            'connectedAccountIds' => 'required|array',
            'image' => 'nullable|file|mimes:jpg,jpeg,mp4,mov,qt,octet-stream|max:512000',
            'is_scheduled' => 'required|boolean',
            'scheduled_date_string' => 'nullable|string',
            'scheduled_time' => 'nullable|string',
            'aiCustomize' => 'boolean|required',
        ]);

        $this->ensureCanSchedulePosts($request);

        $createUserPost->handle($validated, $request->file('image'));

        $successMessage = $validated['is_draft'] ? 'Post saved as draft!' : ($validated['is_scheduled'] ? 'Post scheduled!' : 'Post sent!');

        Inertia::flash('toast', ['type' => 'success', 'message' => __($successMessage)])->render('create');

        return redirect()->route('create');
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
            'connectedAccountIds' => 'required|array',
            'image' => 'nullable|file|mimes:jpg,jpeg,mp4,mov,qt|max:512000',
            'is_scheduled' => 'required|boolean',
            'scheduled_date_string' => 'nullable|string',
            'scheduled_time' => 'nullable|string',
            'aiCustomize' => 'boolean|required',
        ]);

        $this->ensureCanSchedulePosts($request);

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

    private function ensureCanSchedulePosts(Request $request): void
    {
        if (! $request->boolean('is_scheduled') || $request->user()->canSchedulePosts()) {
            return;
        }

        throw ValidationException::withMessages([
            'is_scheduled' => __('Scheduling posts is a Pro feature.'),
        ]);
    }
}
