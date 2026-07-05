import type { System, UserToken } from "./system";

export type userPosts = {
    id: number;
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
    user_token: UserToken;
    user_token_id: number;
    override_content: string | null;
    collaborators: string[] | null;
    tags: string[] | null;
    failed_to_post: boolean;
    impressions: number;
    likes: number;
    replies: number;
}

export type UpNextItem = {
    id: number | string;
    time: Date | string;
    channels: System[];
    hasImage?: boolean;
    content: string;
};


export type RecentlyPublishedMetric = {
    system: System;
    likes: number;
    replies: number;
};

export type RecentlyPublishedItem = {
    id: number | string;
    time: Date | string;
    content: string;
    metrics: RecentlyPublishedMetric[];
    trend?: 'up' | 'flat';
};
