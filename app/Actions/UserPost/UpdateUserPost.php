<?php

namespace App\Actions\UserPost;

use App\Jobs\SendPosts;
use App\Models\UserPost;
use DateTime;
use DateTimeZone;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Date;

class UpdateUserPost
{
    public function __construct(public UploadFile $uploadFile) {}

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
        ]);

        $incomingTokenIds = collect($data['userTokenIds'])->map(fn ($id) => (int) $id)->all();
        $channelContent = $data['channelContent'] ?? [];
        $collaborators = $data['collaborators'] ?? [];
        $tags = $data['tags'] ?? [];

        $userPost->UserPostSystems()->whereNotIn('user_token_id', $incomingTokenIds)->delete();

        $existing = $userPost->UserPostSystems()->get()->keyBy('user_token_id');

        foreach ($incomingTokenIds as $userTokenId) {
            $overrideText = $channelContent[$userTokenId] ?? null;
            $tokenCollaborators = $collaborators[$userTokenId] ?? null;
            $tokenTags = $tags[$userTokenId] ?? null;
            if ($existing->has($userTokenId)) {
                $existing[$userTokenId]->update([
                    'override_content' => $overrideText,
                    'collaborators' => $tokenCollaborators,
                    'tags' => $tokenTags,
                ]);
            } else {
                $userPost->UserPostSystems()->create([
                    'user_token_id' => $userTokenId,
                    'override_content' => $overrideText,
                    'collaborators' => $tokenCollaborators,
                    'tags' => $tokenTags,
                ]);
            }
        }

        $userPostWithData = UserPost::with('UserPostSystems.userToken.system')->find($userPost->id);

        if (! $data['is_draft']) {
            if ($data['is_scheduled'] ?? false) {
                $job = (new SendPosts($userPostWithData))->delay($postDate);
                $jobId = Bus::dispatch($job);

                $userPost->update(['job_id' => $jobId]);
                $userPost->save();
            } else {
                SendPosts::dispatch($userPostWithData);
            }
        }

        return $userPostWithData;
    }
}
