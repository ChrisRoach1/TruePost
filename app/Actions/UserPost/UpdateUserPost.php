<?php

namespace App\Actions\UserPost;

use App\Jobs\SendPosts;
use App\Models\UserPost;
use DateTime;
use DateTimeZone;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Date;

class UpdateUserPost
{
    public function __construct(public UploadFile $uploadFile, public CustomizeWithAI $customizeWithAI) {}

    /**
     * @throws \DateInvalidTimeZoneException
     * @throws \DateMalformedStringException
     */
    public function handle(UserPost $userPost, array $data, ?UploadedFile $file): UserPost
    {
        $userTz = new DateTimeZone(auth()->user()->getTimezone());
        if ($data['is_scheduled'] ?? false) {
            $postDate = new DateTime($data['scheduled_date_string'].' '.$data['scheduled_time'], $userTz);
        } else {
            $postDate = Date::now($userTz);
        }

        $mediaUrl = $this->uploadFile->handle($file);

        $userPost->update([
            'original_content' => $data['content'],
            'is_draft' => $data['is_draft'],
            'post_at' => $data['is_draft'] ? null : $postDate,
            'media_url' => $mediaUrl,
            'dispatched_at' => null,
            'title' => $data['title'] ?? null,
        ]);

        $incomingAccountIds = collect($data['connectedAccountIds'])->map(fn ($id) => (int) $id)->all();
        $channelContent = $data['channelContent'] ?? [];
        $collaborators = $data['collaborators'] ?? [];
        $tags = $data['tags'] ?? [];
        $crosspostList = $data['crosspost_list'] ?? [];

        $aiCustomize = $data['aiCustomize'] ?? false;
        $customizedContent = $aiCustomize ? $this->customizeWithAI->handle($data) : [];

        $userPost->UserPostSystems()->whereNotIn('connected_account_id', $incomingAccountIds)->delete();

        $existing = $userPost->UserPostSystems()->get()->keyBy('connected_account_id');

        foreach ($incomingAccountIds as $connectedAccountId) {
            $overrideText = $aiCustomize
                ? ($customizedContent[$connectedAccountId] ?? null)
                : ($channelContent[$connectedAccountId] ?? null);
            $accountCollaborators = $collaborators[$connectedAccountId] ?? null;
            $accountTags = $tags[$connectedAccountId] ?? null;
            $accountCrosspostList = $crosspostList[$connectedAccountId] ?? null;
            if ($existing->has($connectedAccountId)) {
                $existing[$connectedAccountId]->update([
                    'override_content' => $overrideText,
                    'collaborators' => $accountCollaborators,
                    'tags' => $accountTags,
                    'crosspost_list' => $accountCrosspostList,
                ]);
            } else {
                $userPost->UserPostSystems()->create([
                    'connected_account_id' => $connectedAccountId,
                    'override_content' => $overrideText,
                    'collaborators' => $accountCollaborators,
                    'tags' => $accountTags,
                    'crosspost_list' => $accountCrosspostList,
                ]);
            }
        }

        $userPostWithData = UserPost::with('UserPostSystems.connectedAccount.system')->find($userPost->id);

        // Clearing dispatched_at above re-arms the post for SendDuePosts at its
        // new time. Claim it again when it is going out right now.
        if (! $data['is_draft'] && ! ($data['is_scheduled'] ?? false)) {
            $userPostWithData->update(['dispatched_at' => Date::now()]);

            SendPosts::dispatch($userPostWithData);
        }

        return $userPostWithData;
    }
}
