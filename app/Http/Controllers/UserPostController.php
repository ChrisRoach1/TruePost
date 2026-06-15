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
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Intervention\Image\Laravel\Facades\Image;

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
    public function store(Request $request)
    {
        $request->validate([
            'content' => 'nullable|string',
            'is_draft' => 'required|boolean',
            'channelContent' => 'nullable|array',
            'userTokenIds' => 'required|array',
            'image' => 'nullable|image',
        ]);

        $userTz = new DateTimeZone(auth()->user()->getTimezone());
        if($request->input('is_scheduled')){
            $postDate = new DateTime($request->scheduled_date_string.' '.$request->scheduled_time, $userTz);
        }else{
            $postDate = Date::now($userTz);
        }

        if ($request->hasFile('image')) {
            $mediaUrl = $this->storeImage($request);
        } else {
            $mediaUrl = '';
        }

        $userPost = UserPost::create([
            'original_content' => $request->input('content') ?? null,
            'user_id' => auth()->id(),
            'is_draft' => $request->input('is_draft'),
            'post_at' => $request->input('is_draft') ? null : $postDate,
            'media_url' => $mediaUrl,
        ]);

        foreach ($request->input('userTokenIds') as $userTokenId) {
            $overrideText = $request->input('channelContent')[$userTokenId] ?? null;
            $userPost->UserPostSystems()->create(['user_token_id' => $userTokenId, 'override_content' => $overrideText]);
        }

        $userPostWithData = UserPost::with('UserPostSystems.userToken.system')->find($userPost->id);

        if (! $request->input('is_draft')) {
            if ($request->input('is_scheduled')) {
                $job = (new SendPosts($userPostWithData))->delay($postDate);
                $jobId = Bus::dispatch($job);

                $userPost->update(['job_id' => $jobId]);
                $userPost->save();
            } else {
                SendPosts::dispatch($userPostWithData);
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Post Scheduled!')])->render('dashboard');

        return redirect()->route('dashboard');
    }

    /**
     * @throws \DateMalformedStringException
     * @throws \DateInvalidTimeZoneException
     */
    public function update(Request $request, UserPost $userPost)
    {
        abort_unless($userPost->user_id === auth()->id() && $userPost->is_draft, 403);

        $request->validate([
            'content' => 'nullable|string',
            'is_draft' => 'required|boolean',
            'channelContent' => 'nullable|array',
            'userTokenIds' => 'required|array',
            'image' => 'nullable|image',
        ]);

        $userTz = new DateTimeZone(auth()->user()->getTimezone());
        $postDate = new DateTime($request->scheduled_date_string.' '.$request->scheduled_time, $userTz);

        if ($request->hasFile('image')) {
            $mediaUrl = $this->storeImage($request);
        } else {
            $mediaUrl = $userPost->media_url ?? '';
        }

        $userPost->update([
            'original_content' => $request->input('content'),
            'is_draft' => $request->input('is_draft'),
            'post_at' => $request->input('is_draft') ? null : $postDate,
            'media_url' => $mediaUrl,
        ]);

        $incomingTokenIds = collect($request->input('userTokenIds'))->map(fn ($id) => (int) $id)->all();
        $channelContent = $request->input('channelContent') ?? [];

        $userPost->UserPostSystems()->whereNotIn('user_token_id', $incomingTokenIds)->delete();

        $existing = $userPost->UserPostSystems()->get()->keyBy('user_token_id');

        foreach ($incomingTokenIds as $userTokenId) {
            $overrideText = $channelContent[$userTokenId] ?? null;
            if ($existing->has($userTokenId)) {
                $existing[$userTokenId]->update(['override_content' => $overrideText]);
            } else {
                $userPost->UserPostSystems()->create([
                    'user_token_id' => $userTokenId,
                    'override_content' => $overrideText,
                ]);
            }
        }

        $userPostWithData = UserPost::with('UserPostSystems.userToken.system')->find($userPost->id);

        if (! $request->input('is_draft')) {
            if ($request->input('is_scheduled')) {
                $job = (new SendPosts($userPostWithData))->delay($postDate);
                $jobId = Bus::dispatch($job);

                $userPost->update(['job_id' => $jobId]);
                $userPost->save();
            } else {
                SendPosts::dispatch($userPostWithData);
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Post Updated!')])->render('posts');

        return redirect()->route('userPost.index');
    }

    public function delete(Request $request, UserPost $userPost)
    {
        abort_unless($userPost->user_id === auth()->id(), 403);

        $userPost->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Post deleted!')])->render('posts');

        return redirect()->route('userPost.index');
    }

    public function postNow(Request $request, UserPost $userPost)
    {
        abort_unless($userPost->user_id === auth()->id(), 403);

        if ($userPost->job_id) {
            DB::table('jobs')->where('id', $userPost->job_id)->delete();
        }

        $userTz = new DateTimeZone(auth()->user()->getTimezone());
        $postDate = new DateTime(now($userTz));
        $userPostWithData = UserPost::with('UserPostSystems.userToken.system')->find($userPost->id);

        SendPosts::dispatch($userPostWithData);

        $userPost->update(['post_at' => $postDate, 'job_id' => null, 'has_posted' => true]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Posted!')])->render('posts');

        return redirect()->route('userPost.index');
    }

    public function refreshMetrics(Request $request)
    {
        MetricCalculations::dispatch(auth()->id());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Metrics are refreshing!')])->render('posts');

        return redirect()->route('userPost.index');

    }

    private function storeImage(Request $request): string
    {
        $file = $request->file('image');
        $image = pathinfo($file->hashName(), PATHINFO_FILENAME).'.jpg';

        $encodedImage = Image::decode($file)
            ->scaleDown(1440)->encodeUsingFileExtension('jpg');

        Storage::disk('r2')->put('media/'.$image, (string) $encodedImage, [
            'visibility' => 'public',
            'ContentType' => 'image/jpeg',
            'CacheControl' => 'public, max-age=31536000',
        ]);

        return '/media/'.$image;
    }
}
