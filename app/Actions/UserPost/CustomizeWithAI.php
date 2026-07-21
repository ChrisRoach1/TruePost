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

            $userToken = UserToken::where(['user_id' => auth()->id(), 'id' => $userTokenId])->firstOrFail();
            $customizedPost = (new PostCustomizer($userToken->System->name))->prompt($data['content']);
            $responses[$userTokenId] = $customizedPost->text;
        }

        return $responses;
    }
}
