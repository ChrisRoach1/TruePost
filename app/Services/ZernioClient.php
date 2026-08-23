<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Zernio\Api\AnalyticsApi;
use Zernio\Api\PostsApi;
use Zernio\ApiException;
use Zernio\Configuration;
use Zernio\Model\CreatePostRequest;
use Zernio\Model\CreatePostRequestPlatformsInner;
use Zernio\Model\MediaItem;

class ZernioClient
{
    public function __construct(
        private readonly string $apiKey,
        private readonly string $baseUrl,
    ) {}

    /**
     * @throws RequestException
     * @throws ConnectionException
     */
    public function createProfile(string $name, ?string $description = null): array
    {
        return $this->request()
            ->post('profiles', ['name' => $name, 'description' => $description])
            ->throw()
            ->json('profile');
    }

    /**
     * @throws RequestException
     * @throws ConnectionException
     */
    public function connectUrl(string $platform, string $profileId, string $redirectUrl): string
    {
        return $this->request()
            ->get("connect/{$platform}", [
                'profileId' => $profileId,
                'redirect_url' => $redirectUrl,
            ])
            ->throw()
            ->json('authUrl');
    }

    /** @return array<int, array<string, mixed>>
     * @throws ConnectionException|RequestException
     */
    public function accounts(string $profileId): array
    {
        return $this->request()
            ->get('accounts', ['profileId' => $profileId])
            ->throw()
            ->json('accounts', []);
    }

    /**
     * @throws RequestException
     * @throws ConnectionException
     */
    public function disconnectAccount(string $accountId): void
    {
        $this->request()->delete("accounts/{$accountId}")->throw();
    }

    public function sendPost(string $platform, string $accountId, string $postContent, ?string $mediaUrl): ?string
    {
        $config = Configuration::getDefaultConfiguration()->setAccessToken(config('services.zernio.key'));
        $postsApi = new PostsApi(new Client, $config);

        $platformRequest = new CreatePostRequestPlatformsInner;
        $platformRequest->setPlatform($platform);
        $platformRequest->setAccountId($accountId);
        $request = new CreatePostRequest;
        $request->setContent($postContent);

        if (! empty($mediaUrl)) {
            $media_url = config('services.r2.public_endpoint').$mediaUrl;
            $mediaItem = new MediaItem;
            $mediaItem->setUrl($media_url);
            $mediaItem->setType((str_contains($media_url, '.mov') || str_contains($media_url, '.mp4')) ? MediaItem::TYPE_VIDEO : MediaItem::TYPE_IMAGE);
            $request->setMediaItems([$mediaItem]);
        }

        $request->setPlatforms([$platformRequest]);
        $request->setPublishNow(true);

        try {
            $result = $postsApi->createPost($request);

            return $result->getPost()->getId();
        } catch (ApiException $e) {
            \Log::error('Exception when calling PostsApi->createPost: ', [$e->getMessage()]);

            return null;
        }
    }

    public function getPostAnalytics(string $postId): array
    {
        $config = Configuration::getDefaultConfiguration()->setAccessToken(config('services.zernio.key'));
        $api = new AnalyticsApi(new Client,$config);

        try {
            $analyticsRequest = $api->getAnalytics($postId);

            return [$analyticsRequest->getAnalytics()->getImpressions(), $analyticsRequest->getAnalytics()->getLikes(), $analyticsRequest->getAnalytics()->getComments()];
        } catch (ApiException $e) {
            return [];
        }
    }

    private function request(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl)
            ->withToken($this->apiKey)
            ->acceptJson()
            ->timeout(15)
            ->retry(2, 200);
    }
}
