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
use Zernio\Model\InstagramPlatformData;
use Zernio\Model\InstagramPlatformDataUserTagsInner;
use Zernio\Model\MediaItem;
use Zernio\Model\RedditPlatformData;

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

    public function sendPost(string $platform, string $accountId, string $postContent, ?string $mediaUrl, ?array $collaborators = null, ?array $tags = null, ?string $crosspost = null, ?string $title = null): ?string
    {
        $config = Configuration::getDefaultConfiguration()->setAccessToken(config('services.zernio.key'));
        $postsApi = new PostsApi(new Client, $config);

        $platformRequest = new CreatePostRequestPlatformsInner;
        $platformRequest->setPlatform($platform);
        $platformRequest->setAccountId($accountId);
        $request = new CreatePostRequest;
        $request->setContent($postContent);

        $isVideo = false;

        if (! empty($mediaUrl)) {
            $media_url = config('services.r2.public_endpoint').$mediaUrl;
            $isVideo = str_contains($media_url, '.mov') || str_contains($media_url, '.mp4');
            $mediaItem = new MediaItem;
            $mediaItem->setUrl($media_url);
            $mediaItem->setType($isVideo ? MediaItem::TYPE_VIDEO : MediaItem::TYPE_IMAGE);
            $request->setMediaItems([$mediaItem]);
        }

        switch ($platform) {
            case 'instagram':
                $specificData = $this->instagramPlatformData($collaborators, $tags, $isVideo);

                if ($specificData != null) {
                    $platformRequest->setPlatformSpecificData($specificData);
                }

                break;
            case 'reddit':
                $specificData = $this->redditPlatformData($crosspost, $title);
                $platformRequest->setPlatformSpecificData($specificData);
        }

        $request->setPlatforms([$platformRequest]);
        $request->setPublishNow(true);

        try {
            return retry(
                3,
                function () use ($postsApi, $request) {
                    $result = $postsApi->createPost($request);

                    return $result->getPost()->getId();
                },
                fn (int $attempt, \Throwable $exception) => $this->retryAfterMilliseconds($exception),
                fn (\Throwable $exception) => $exception instanceof ApiException &&
                    ($exception->getCode() === 429 || $exception->getCode() === 500 || $exception->getCode() === 502 || $exception->getCode() === 503 || $exception->getCode() === 504),
            );
        } catch (ApiException $e) {
            \Log::error('Exception when calling PostsApi->createPost: ', [$e->getMessage(), $e->getCode()]);

            return null;
        }
    }

    private function instagramPlatformData(?array $collaborators, ?array $tags, bool $isVideo): ?InstagramPlatformData
    {
        $fields = [];

        $collaborators = array_values(array_filter($collaborators ?? []));

        if (! empty($collaborators)) {
            $fields['collaborators'] = $collaborators;
        }

        $tags = array_values(array_filter($tags ?? []));

        if (! empty($tags)) {
            $userTags = [];
            foreach ($tags as $index => $username) {
                if ($isVideo) {
                    // Reels/videos take the username only, coordinates are ignored.
                    $userTags[] = new InstagramPlatformDataUserTagsInner(['username' => $username]);

                    continue;
                }

                $userTags[] = new InstagramPlatformDataUserTagsInner([
                    'username' => $username,
                    // Images require x/y coordinates (0-1). Spread tags vertically so no two
                    // tags share the same point, which Instagram rejects.
                    'x' => 0.5,
                    'y' => round(min(0.9, 0.1 + ($index * 0.15)), 2),
                ]);
            }

            $fields['user_tags'] = $userTags;
        }

        return empty($fields) ? null : new InstagramPlatformData($fields);
    }

    private function redditPlatformData(?string $subreddit, ?string $title): ?RedditPlatformData
    {
        $redditPlatformData = new RedditPlatformData;

        if ($subreddit) {
            $redditPlatformData->setSubreddit($subreddit);
        }

        if ($title) {
            $redditPlatformData->setTitle($title);
        }

        return $redditPlatformData;
    }

    public function getPostAnalytics(string $postId): array
    {
        $config = Configuration::getDefaultConfiguration()->setAccessToken(config('services.zernio.key'));
        $api = new AnalyticsApi(new Client, $config);

        try {
            $analyticsRequest = $api->getAnalytics($postId);

            return [$analyticsRequest->getAnalytics()->getImpressions(), $analyticsRequest->getAnalytics()->getLikes(), $analyticsRequest->getAnalytics()->getComments()];
        } catch (ApiException $e) {
            return [];
        }
    }

    private function retryAfterMilliseconds(\Throwable $exception): int
    {
        $fallback = 60_000;

        if (! $exception instanceof ApiException) {
            return $fallback;
        }

        $headers = array_change_key_case($exception->getResponseHeaders() ?? [], CASE_LOWER);
        $retryAfter = $headers['retry-after'] ?? 60;

        if (is_array($retryAfter)) {
            $retryAfter = $retryAfter[0] ?? 60;
        }

        return is_numeric($retryAfter) ? ((int) $retryAfter) * 1000 : $fallback;
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
