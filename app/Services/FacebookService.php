<?php

namespace App\Services;

use App\Models\UserPostSystem;
use App\Models\UserToken;
use Illuminate\Support\Facades\Http;

class FacebookService implements SocialServiceInterface
{

    public function getPosts()
    {
        // TODO: Implement getPosts() method.
    }

    public function createPost(UserPostSystem $userPostSystem, string $content, ?string $media = null)
    {
        $content = $userPostSystem->override_content ?? $content;
        $media_url = env('R2_PUBLIC_ENDPOINT').'/'.$media;
        $containerCreationResponse = Http::withToken($userPostSystem->userToken->access_token)->post('https://graph.instagram.com/v25.0/'.$userPostSystem->userToken->user_token_id.'/media',
            [
                'caption' => $content,
                'image_url' => $media_url,
            ]);

        $containerId = $containerCreationResponse->json()['id'];

        $postCreationResponse = Http::withToken($userPostSystem->userToken->access_token)->post('https://graph.instagram.com/v25.0/'.$userPostSystem->userToken->user_token_id.'/media_publish?creation_id='.$containerId);

        if (array_key_exists('error', $postCreationResponse->json())) {
            $attempts = 0;
            while ($attempts < 10) {
                $postCreationResponse = Http::withToken($userPostSystem->userToken->access_token)->post('https://graph.instagram.com/v25.0/'.$userPostSystem->userToken->user_token_id.'/media_publish?creation_id='.$containerId);
                if (! array_key_exists('error', $postCreationResponse->json())) {
                    break;
                }
                $attempts++;
            }
        }

        $responseId = $postCreationResponse->json()['id'];
        UserPostSystem::query()->where('id', $userPostSystem->id)->update(['created_post_Id' => $responseId]);    }

    public function refreshToken(UserToken $userToken)
    {
        // TODO: Implement refreshToken() method.
    }

    public function getPostMetrics(UserPostSystem $userPostSystem)
    {
        // TODO: Implement getPostMetrics() method.
    }
}
