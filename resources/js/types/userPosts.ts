import type { ConnectedAccount } from "./system";

export type userPosts = {
    id: number;
    title: string | null;
    original_content: string | null;
    content?: string;
    post_at: Date | null;
    is_draft: boolean;
    media_url: string | null;
    created_at: Date;
    user_post_systems: userPostSystems[];
    has_posted: boolean;
}

export type userPostSystems = {
    id: number;
    connected_account: ConnectedAccount;
    connected_account_id: number;
    override_content: string | null;
    collaborators: string[] | null;
    crosspost_list: string[] | null;
    tags: string[] | null;
    failed_to_post: boolean;
    impressions: number;
    likes: number;
    replies: number;
}

export type RecentlyPublishedItem = {
    id: number | string;
    time: Date | string;
    content: string;
    user_post_systems: userPostSystems[];
    trend?: 'up' | 'flat';
};
