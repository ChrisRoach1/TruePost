<?php

namespace App\Actions\UserPost;

use App\Ai\Agents\PostCustomizer;
use App\Models\UserToken;

class CustomizeWithAI
{
    public function handle(array $data): array
    {
        $responses = [];

        foreach ($data['userTokenIds'] as $userTokenId) {

            $userToken = UserToken::where(['user_id' => auth()->id(), 'id' => $userTokenId])->with('System')->firstOrFail();
            $customizedPost = (new PostCustomizer($userToken->System->name))->prompt('post to remix: '.$data['content'].'. Be sure to keep it within the limit of '.$userToken->System->max_post_length.' characters.');
            $responses[$userTokenId] = $customizedPost->text;
        }

        return $responses;
    }
}
