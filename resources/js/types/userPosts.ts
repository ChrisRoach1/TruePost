import type { UserToken } from "./system";

export type userPosts = {
    id: number;
    content: string;
    post_at: Date;
    is_draft: boolean;
    created_at: Date;
    user_post_systems: userPostSystems[];
}

export type userPostSystems = {
    id: number;
    user_token: UserToken;
    user_token_id: number;
    failed_to_post: boolean;
}
