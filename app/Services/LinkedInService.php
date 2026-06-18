<?php

namespace App\Services;

use App\Jobs\TokenRefresh;
use App\Models\PostMetric;
use App\Models\UserPostSystem;
use App\Models\UserToken;
use Date;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Storage;

class LinkedInService implements SocialServiceInterface
{
    /**
     * @throws ConnectionException
     */
    public function createPost(UserPostSystem $userPostSystem, string $content, ?string $media = null): void
    {
        $personURN = "urn:li:person:{$userPostSystem->userToken->user_token_id}";
        $content = $userPostSystem->override_content ?? $content;
        if ($media != null) {
            $file = Storage::disk('r2')->get($media);

            $registerMediaResponse = Http::withToken($userPostSystem->userToken->access_token)->post('https://api.linkedin.com/v2/assets?action=registerUpload', [
                'registerUploadRequest' => [
                    'recipes' => [
                        'urn:li:digitalmediaRecipe:feedshare-image',
                    ],
                    'owner' => $personURN,
                    'serviceRelationships' => [
                        [
                            'relationshipType' => 'OWNER',
                            'identifier' => 'urn:li:userGeneratedContent',
                        ],
                    ],
                ],
            ]);

            $mediaUploadURL = $registerMediaResponse->json()['value']['uploadMechanism']['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']['uploadUrl'];
            $assetKey = $registerMediaResponse->json()['value']['asset'];

            $mediaUploadResponse = Http::withToken($userPostSystem->userToken->access_token)->attach('file', $file, 'media.jpg')->post($mediaUploadURL);

            // need to change shareMediaCategory when implementing videos

            $response = Http::withToken($userPostSystem->userToken->access_token)->post('https://api.linkedin.com/v2/ugcPosts',
                [
                    'author' => $personURN,
                    'lifecycleState' => 'PUBLISHED',
                    'specificContent' => [
                        'com.linkedin.ugc.ShareContent' => [
                            'shareCommentary' => [
                                'text' => $content,
                            ],
                            'shareMediaCategory' => 'IMAGE',
                            'media' => [
                                [
                                    'status' => 'READY',
                                    'media' => $assetKey,
                                ],
                            ],
                        ],
                    ],
                    'visibility' => [
                        'com.linkedin.ugc.MemberNetworkVisibility' => 'PUBLIC',
                    ],
                ]);

        } else {

            $response = Http::withToken($userPostSystem->userToken->access_token)->post('https://api.linkedin.com/v2/ugcPosts',
                [
                    'author' => $personURN,
                    'lifecycleState' => 'PUBLISHED',
                    'specificContent' => [
                        'com.linkedin.ugc.ShareContent' => [
                            'shareCommentary' => [
                                'text' => $content,
                            ],
                            'shareMediaCategory' => 'NONE',
                        ],
                    ],
                    'visibility' => [
                        'com.linkedin.ugc.MemberNetworkVisibility' => 'PUBLIC',
                    ],
                ]);

        }
    }

    public function getPosts()
    {
        // TODO: Implement getPosts() method.
    }

    /**
     * @throws ConnectionException
     */
    public function refreshToken(UserToken $userToken): void
    {
        $response = Http::post('https://www.linkedin.com/oauth/v2/accessToken', [
            'grant_type' => 'refresh_token',
            'refresh_token' => $userToken->refresh_token,
            'client_id' => env('LINKEDIN_CLIENT_ID'),
            'client_secret' => env('LINKEDIN_CLIENT_SECRET'),
        ]);
        $user = $response->json();

        $userToken->update([
            'access_token' => $user['access_token'],
            'refresh_token' => $user['refresh_token'],
            'expires_at' => Date::now()->addSeconds($user['expires_in']),
            'refresh_token_expires_at' => Date::now()->addSeconds($user['refresh_token_expires_in']),
        ]);

        TokenRefresh::dispatch($userToken)->delay(Date::now()->addDays(55));
    }

    public function getPostMetrics(UserPostSystem $userPostSystem)
    {
        $mediaUploadResponse = Http::withToken($userPostSystem->userToken->access_token)->get('https://graph.instagram.com/'.$userPostSystem->created_post_Id.'/insights',
            [
                'metric' => 'likes,comments,views',
            ])->json();

        if (array_key_exists('error', $mediaUploadResponse)) {
            return;
        }

        $likeCount = (int) $mediaUploadResponse['data'][0]['values'][0]['value'];
        $impressionCount = (int) $mediaUploadResponse['data'][2]['values'][0]['value'];
        $replyCount = (int) $mediaUploadResponse['data'][1]['values'][0]['value'];

        PostMetric::create([
            'likes' => $userPostSystem->likes ?? 0,
            'replies' => $userPostSystem->replies ?? 0,
            'impressions' => $userPostSystem->impressions ?? 0,
            'user_post_system_id' => $userPostSystem->id,
        ]);

        UserPostSystem::find($userPostSystem->id)->update([
            'likes' => $likeCount,
            'replies' => $replyCount,
            'impressions' => $impressionCount,
        ]);
    }
}
