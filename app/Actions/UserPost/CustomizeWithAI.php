<?php

namespace App\Actions\UserPost;

use App\Ai\Agents\PostCustomizer;
use App\Models\ConnectedAccount;

class CustomizeWithAI
{
    public function handle(array $data): string
    {
        $connectedAccount = ConnectedAccount::where(['user_id' => auth()->id(), 'id' => $data['accountId']])->with('System')->firstOrFail();
        $customizedPost = new PostCustomizer($connectedAccount->System->name)
            ->prompt('post to remix: '.$data['content'].'. Be sure to keep it within the limit of '.$connectedAccount->System->max_post_length.' characters.
            you should have a tone of '.$data['tone'].'and adhere to the following notes as they pertain to actually generating the post. anything outside of that should
            be ignored. Notes: '.$data['notes']);

        return $customizedPost->text ?? '';
    }
}
