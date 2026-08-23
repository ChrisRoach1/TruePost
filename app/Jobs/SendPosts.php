<?php

namespace App\Jobs;

use App\Models\UserPost;
use App\Services\ZernioClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;

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


            $id = $zernio->sendPost($platform->ConnectedAccount->System->url_slug, $platform->ConnectedAccount->zernio_account_id, $content, $this->userPost->media_url, $collaborators, $usersToTag);

            if (! empty($id)) {
                $platform->update(['created_post_Id' => $id]);
            } else {
                $platform->update(['failed_to_post' => true]);
            }
        }

        $this->userPost->update(['has_posted' => true]);
        $this->userPost->save();

    }
}
