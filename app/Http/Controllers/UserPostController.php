<?php

namespace App\Http\Controllers;

use App\Jobs\SendPosts;
use App\Models\UserPost;
use DateTime;
use DateTimeZone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Intervention\Image\Laravel\Facades\Image;

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
            'timezone' => 'required|timezone',
        ]);

        $userTz = new DateTimeZone($request->timezone);
        $postDate = new DateTime($request->scheduled_date_string.' '.$request->scheduled_time, $userTz);

        if ($request->hasFile('image')) {

            $file = $request->file('image');
            $image = pathinfo($file->hashName(), PATHINFO_FILENAME).'.jpg';

            $encodedImage = Image::decode($file)
                ->scaleDown(1440)->encodeUsingFileExtension('jpg');

            Storage::disk('r2')->put('media/'.$image, (string) $encodedImage, [
                'visibility' => 'public',
                'ContentType' => 'image/jpeg',
                'CacheControl' => 'public, max-age=31536000',
            ]);

            $mediaUrl = '/media/'.$image;
        } else {
            $mediaUrl = '';
        }

        $userPost = UserPost::create([
            'original_content' => $request->input('content'),
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
}
