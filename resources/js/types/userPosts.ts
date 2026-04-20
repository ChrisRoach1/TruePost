import type { UserToken } from "./system";

export type userPosts = {
    id: number;
    content: string;
    post_at: Date;
    created_at: Date;
    user_post_systems: userPostSystems[];
}

export type userPostSystems = {
    id: number;
    system_id: number;
    user_token: UserToken;
}
