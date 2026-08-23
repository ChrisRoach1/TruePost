<?php

namespace App\Actions\UserPost;

use App\Jobs\SendPosts;
use App\Models\UserPost;
use DateTime;
use DateTimeZone;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Date;

class CreateUserPost
{
    public function __construct(public UploadFile $uploadFile, public CustomizeWithAI $customizeWithAI) {}

    /**
     * @throws \DateInvalidTimeZoneException
     * @throws \DateMalformedStringException
     */
    public function handle(array $data, ?UploadedFile $file): UserPost
    {
        $userTz = new DateTimeZone(auth()->user()->getTimezone());

        if ($data['is_scheduled'] ?? false) {
            $postDate = new DateTime($data['scheduled_date_string'].' '.$data['scheduled_time'], $userTz);
        } else {
            $postDate = Date::now($userTz);
        }

        $mediaUrl = $this->uploadFile->handle($file);

        $userPost = UserPost::create([
            'original_content' => $data['content'] ?? null,
            'user_id' => auth()->id(),
            'is_draft' => $data['is_draft'] ?? false,
            'post_at' => $data['is_draft'] ? null : $postDate,
            'media_url' => $mediaUrl,
        ]);

        if ($data['aiCustomize']) {
            $customizedContent = $this->customizeWithAI->handle($data);
            foreach ($data['connectedAccountIds'] as $connectedAccountId) {
                $overrideText = $customizedContent[$connectedAccountId] ?? null;
                $collaborators = $data['collaborators'][$connectedAccountId] ?? null;
                $tags = $data['tags'][$connectedAccountId] ?? null;
                $userPost->UserPostSystems()->create([
                    'connected_account_id' => $connectedAccountId,
                    'override_content' => $overrideText,
                    'collaborators' => $collaborators,
                    'tags' => $tags,
                ]);
            }

        } else {
            foreach ($data['connectedAccountIds'] as $connectedAccountId) {
                $overrideText = $data['channelContent'][$connectedAccountId] ?? null;
                $collaborators = $data['collaborators'][$connectedAccountId] ?? null;
                $tags = $data['tags'][$connectedAccountId] ?? null;
                $userPost->UserPostSystems()->create([
                    'connected_account_id' => $connectedAccountId,
                    'override_content' => $overrideText,
                    'collaborators' => $collaborators,
                    'tags' => $tags,
                ]);
            }
        }

        $userPostWithData = UserPost::with('UserPostSystems.connectedAccount.system')->find($userPost->id);

        // Scheduled posts are left for SendDuePosts to pick up once post_at
        // passes. Claim the ones going out now so that sweep skips them.
        if (! $data['is_draft'] && ! ($data['is_scheduled'] ?? false)) {
            $userPostWithData->update(['dispatched_at' => Date::now()]);

            SendPosts::dispatch($userPostWithData);
        }

        return $userPostWithData;
    }
}
