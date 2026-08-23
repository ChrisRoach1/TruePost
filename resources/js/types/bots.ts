import type { ConnectedAccount } from "./system";

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
    connected_account_id: number;
    connected_account: ConnectedAccount;
}
