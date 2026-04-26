<?php

namespace App\Http\Controllers;

use App\Jobs\SendPosts;
use App\Models\UserPost;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Bus;
use Inertia\Inertia;

class UserPostController extends Controller
{
    public function index()
    {
        $userPosts = UserPost::query()->with('UserPostSystems.userToken.system')->where('user_id', auth()->id())->orderBy('id', 'desc')->get();

        return Inertia::render('posts',
            [
                'userPosts' => $userPosts,
            ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'content' => 'nullable|string',
            'scheduled_date' => 'required',
            'scheduled_date_string' => 'required',
            'scheduled_time' => 'required',
            'channelContent' => 'nullable|array',
            'userTokenIds' => 'required|array',
            'timezone' => 'required|timezone',
            'image' => 'nullable|image|mimes:jpeg|mimetypes:image/jpeg',
        ]);

        $userTz = new \DateTimeZone($request->timezone);
        $postDate = new \DateTime($request->scheduled_date_string.' '.$request->scheduled_time, $userTz);

        $userPost = UserPost::create([
            'original_content' => $request->input('content'),
            'user_id' => auth()->id(),
            'post_at' => $postDate,
            'media_url' => '',
        ]);

        foreach ($request->input('userTokenIds') as $userTokenId) {
            $overrideText = $request->input('channelContent')[$userTokenId] ?? null;
            $userPost->UserPostSystems()->create(['user_token_id' => $userTokenId, 'override_content' => $overrideText]);
        }

        $userPostWithData = UserPost::with('UserPostSystems.userToken.system')->find($userPost->id);

        $job = (new SendPosts($userPostWithData))->delay($postDate);
        $jobId = Bus::dispatch($job);

        $userPost->update(['job_id' => $jobId]);
        $userPost->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Post Scheduled!')])->render('dashboard');

        return redirect()->route('dashboard');
    }
}
