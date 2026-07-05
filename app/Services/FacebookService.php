<?php

namespace App\Services;

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
        $media_url = env('R2_PUBLIC_ENDPOINT').'/'.$media;

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
        // TODO: Implement getPostMetrics() method.
    }

    public function SendPostRequest(UserPostSystem $userPostSystem, string $content, ?string $media_url = null): LazyPromise|PromiseInterface|Response
    {

        if (! $media_url) {
            $postCreationResponse = Http::withToken($userPostSystem->userToken->access_token)->post('https://graph.facebook.com/v25.0/'.$userPostSystem->userToken->user_token_id.'/feed', [
                'message' => $content,
            ]);
        } else {
            $postCreationResponse = Http::withToken($userPostSystem->userToken->access_token)->post('https://graph.facebook.com/v25.0/'.$userPostSystem->userToken->user_token_id.'/feed', [
                'message' => $content,
                'url' => $media_url,
            ]);
        }

        return $postCreationResponse;
    }
}
