<?php

namespace App\Services;

use App\Jobs\TokenRefresh;
use App\Models\UserToken;
use Illuminate\Support\Facades\Http;

class LinkedInService implements SocialServiceInterface
{
    public function createPost(string $authToken, string $content, ?string $user_token_id = null, ?string $media = null): void
    {
        $personURN = "urn:li:person:{$user_token_id}";

        if ($media != null) {
            $file = \Storage::disk('r2')->get($media);

            $registerMediaResponse = Http::withToken($authToken)->post('https://api.linkedin.com/v2/assets?action=registerUpload', [
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

            $mediaUploadResponse = Http::withToken($authToken)->attach('file', $file, 'media.jpg')->post($mediaUploadURL);

            // need to change shareMediaCategory when implementing videos

            $response = Http::withToken($authToken)->post('https://api.linkedin.com/v2/ugcPosts',
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

            $response = Http::withToken($authToken)->post('https://api.linkedin.com/v2/ugcPosts',
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

    public function refreshToken(UserToken $userToken)
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
            'expires_at' => \Date::now()->addSeconds($user['expires_in']),
            'refresh_token_expires_at' => \Date::now()->addSeconds($user['refresh_token_expires_in']),
        ]);

        TokenRefresh::dispatch($userToken)->delay(\Date::now()->addDays(55));
    }
}
