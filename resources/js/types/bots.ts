import type { UserToken } from "./system";

export type BotPost = {
    id: number;
    bot_description: string;
    post_times?: string[] | null;
    next_post_at?: string | null;
    bot_post_systems: BotPostSystems[];
};

export type BotPostSystems = {
    id: number;
    bot_post_id?: number;
    user_token_id: number;
    user_token: UserToken;
}
