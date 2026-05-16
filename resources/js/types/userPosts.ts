import type { UserToken } from "./system";

export type userPosts = {
    id: number;
    original_content: string | null;
    content?: string;
    post_at: Date | null;
    is_draft: boolean;
    media_url: string | null;
    created_at: Date;
    user_post_systems: userPostSystems[];
}

export type userPostSystems = {
    id: number;
    user_token: UserToken;
    user_token_id: number;
    override_content: string | null;
    failed_to_post: boolean;
}
