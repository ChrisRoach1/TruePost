<?php

namespace App\Services;

use App\Models\PostMetric;
use App\Models\UserPostSystem;
use App\Models\UserToken;
use Exception;
use GuzzleHttp\Promise\PromiseInterface;
use Illuminate\Http\Client\Promises\LazyPromise;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class FacebookService implements ISocialService
{
    public function getPosts()
    {
        // TODO: Implement getPosts() method.
    }

    /**
     * @throws Exception
     */
    public function createPost(UserPostSystem $userPostSystem, string $content, ?string $media = null)
    {
        $content = $userPostSystem->override_content ?? $content;
        $media_url = $media ? env('R2_PUBLIC_ENDPOINT').'/'.$media : null;

        $postCreationResponse = $this->SendPostRequest($userPostSystem, $content, $media_url);
        
        if (array_key_exists('error', $postCreationResponse->json())) {
            $attempts = 0;
            while ($attempts < 10) {
                $postCreationResponse = $this->SendPostRequest($userPostSystem, $content, $media_url);
                if (! array_key_exists('error', $postCreationResponse->json())) {
                    break;
                }
                $attempts++;
            }

            if ($attempts == 10) {
                throw new Exception('Failed to upload media after 10 attempts');
            }
        }

        if (array_key_exists('post_id', $postCreationResponse->json())) {
            $responseId = $postCreationResponse->json()['post_id'];
        } else {
            $responseId = $postCreationResponse->json()['id'];
        }

        UserPostSystem::query()->where('id', $userPostSystem->id)->update(['created_post_Id' => $responseId]);
    }

    public function refreshToken(UserToken $userToken)
    {
        // TODO: Implement refreshToken() method.
    }

    public function getPostMetrics(UserPostSystem $userPostSystem)
    {
        $metricsResponse = Http::withToken($userPostSystem->userToken->access_token)
            ->get('https://graph.facebook.com/v25.0/'.$userPostSystem->created_post_Id.'?fields=reactions.limit(0).summary(true),comments.limit(0).summary(true)')
            ->json();

        if (array_key_exists('error', $metricsResponse)) {
            return;
        }

        $likeCount = (int) $metricsResponse['reactions']['summary']['total_count'];
        $replyCount = (int) $metricsResponse['comments']['summary']['total_count'];

        PostMetric::create([
            'likes' => $userPostSystem->likes ?? 0,
            'replies' => $userPostSystem->replies ?? 0,
            'impressions' => $userPostSystem->impressions ?? 0,
            'user_post_system_id' => $userPostSystem->id,
        ]);

        UserPostSystem::find($userPostSystem->id)->update([
            'likes' => $likeCount,
            'replies' => $replyCount,
        ]);
    }

    public function SendPostRequest(UserPostSystem $userPostSystem, string $content, ?string $media_url = null): LazyPromise|PromiseInterface|Response
    {

        $token = $userPostSystem->userToken->access_token;
        $pageId = $userPostSystem->userToken->user_token_id;

        if (! $media_url) {
            return Http::withToken($token)->post('https://graph.facebook.com/v25.0/'.$pageId.'/feed', [
                'message' => $content,
            ]);
        }

        // Video and image posts go to different Graph API endpoints. The /feed
        // endpoint ignores media parameters, which results in a text-only post.
        if (str_contains($media_url, '.mov') || str_contains($media_url, '.mp4')) {
            return Http::withToken($token)->post('https://graph.facebook.com/v25.0/'.$pageId.'/videos', [
                'description' => $content,
                'file_url' => $media_url,
            ]);
        }

        return Http::withToken($token)->post('https://graph.facebook.com/v25.0/'.$pageId.'/photos', [
            'caption' => $content,
            'url' => $media_url,
        ]);
    }
}
