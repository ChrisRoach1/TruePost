<?php

namespace App\Actions\UserPost;

use App\Ai\Agents\PostCustomizer;
use App\Models\ConnectedAccount;

class CustomizeWithAI
{
    public function handle(array $data): array
    {
        $responses = [];

        foreach ($data['connectedAccountIds'] as $connectedAccountId) {

            $connectedAccount = ConnectedAccount::where(['user_id' => auth()->id(), 'id' => $connectedAccountId])->with('System')->firstOrFail();
            $customizedPost = (new PostCustomizer($connectedAccount->System->name))->prompt('post to remix: '.$data['content'].'. Be sure to keep it within the limit of '.$connectedAccount->System->max_post_length.' characters.');
            $responses[$connectedAccountId] = $customizedPost->text;
        }

        return $responses;
    }
}
