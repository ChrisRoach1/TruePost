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
        //dd($userPosts);
        return Inertia::render('posts',
            [
                'userPosts' => $userPosts,
            ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'content' => 'required|string',
            'scheduled_date' => 'required',
            'scheduled_date_string' => 'required',
            'scheduled_time' => 'required',
            'userTokenIds' => 'required|array',
            'timezone' => 'required|timezone',
        ]);

        $userTz = new \DateTimeZone($request->timezone);
        $postDate = new \DateTime($request->scheduled_date_string.' '.$request->scheduled_time, $userTz);

        $userPost = UserPost::create([
            'content' => $request->input('content'),
            'user_id' => auth()->id(),
            'post_at' => $postDate,
        ]);

        foreach ($request->input('userTokenIds') as $userTokenId) {
            $userPost->UserPostSystems()->create(['user_token_id' => $userTokenId]);
        }

        $job = (new SendPosts($userPost))->delay($postDate);
        $jobId = Bus::dispatch($job);

        $userPost->update(['job_id' => $jobId]);
        $userPost->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Post Scheduled!')])->render('dashboard');

        return redirect()->route('dashboard');
    }
}
