<?php

namespace App\Jobs;

use App\Models\UserPost;
use App\Services\ZernioClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;
use Zernio\ApiException;

class SendPosts implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(public UserPost $userPost)
    {
        //
    }

    public function handle(ZernioClient $zernio): void
    {
        foreach ($this->userPost->UserPostSystems as $platform) {
            $content = $platform->override_content ?? $this->userPost->original_content;

            $collaborators = array_values(array_filter($platform->collaborators ?? []));

            $usersToTag = array_values(array_filter($platform->tags ?? []));

            if ($platform->crosspost_list != null) {
                $ids = [];
                try {
                    foreach ($platform->crosspost_list as $crosspost) {

                        $id = retry(
                            3,
                            function () use ($zernio, $platform, $content, $collaborators, $crosspost, $usersToTag) {
                                return $zernio->sendPost(
                                    $platform->ConnectedAccount->System->url_slug,
                                    $platform->ConnectedAccount->zernio_account_id,
                                    $content,
                                    $this->userPost->media_url,
                                    $collaborators,
                                    $usersToTag,
                                    $crosspost,
                                    $this->userPost->title);
                            },
                            fn (int $attempt, \Throwable $exception) => $this->retryAfterMilliseconds($exception),
                            fn (\Throwable $exception) => $exception instanceof ApiException &&
                                ($exception->getCode() === 429 || $exception->getCode() === 500 || $exception->getCode() === 502 || $exception->getCode() === 503 || $exception->getCode() === 504),
                        );

                        $ids[] = $id;

                    }
                    if (! empty($ids)) {
                        $platform->update(['crosspost_ids' => $ids, 'failed_to_post' => false, 'error_message' => null]);
                    }
                } catch (ApiException $ex) {
                    $friendlyError = json_decode($ex->getResponseBody() ?? '');
                    $errorMessage = $friendlyError->error ?? 'Unknown error has occurred. Please try again later.';
                    $platform->update(['failed_to_post' => true, 'error_message' => $errorMessage]);
                    \Log::error('failed to post with error: '.$ex->getMessage());
                }

            } else {
                try {

                    $id = retry(3,
                        function () use ($zernio, $platform, $content, $collaborators, $usersToTag) {
                            return $zernio->sendPost($platform->ConnectedAccount->System->url_slug,
                                $platform->ConnectedAccount->zernio_account_id,
                                $content,
                                $this->userPost->media_url,
                                $collaborators,
                                $usersToTag);
                        },
                        fn (int $attempt, \Throwable $exception) => $this->retryAfterMilliseconds($exception),
                        fn (\Throwable $exception) => $exception instanceof ApiException &&
                            ($exception->getCode() === 429 || $exception->getCode() === 500 || $exception->getCode() === 502 || $exception->getCode() === 503 || $exception->getCode() === 504),
                    );

                    if (! empty($id)) {
                        $platform->update(['created_post_Id' => $id, 'failed_to_post' => false, 'error_message' => null]);
                    }
                } catch (ApiException $ex) {
                    $friendlyError = json_decode($ex->getResponseBody() ?? '');
                    $errorMessage = $friendlyError->error ?? 'Unknown error has occurred. Please try again later.';
                    $platform->update(['failed_to_post' => true, 'error_message' => $errorMessage]);
                    \Log::error('failed to post with error: '.$ex->getMessage());
                }
            }
        }

        $published = $this->userPost->UserPostSystems()
            ->where(fn ($query) => $query->whereNotNull('created_post_Id')->orWhereNotNull('crosspost_ids'))
            ->exists();

        $this->userPost->update(['has_posted' => $published]);
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
}
