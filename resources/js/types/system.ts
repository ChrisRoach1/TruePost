export type UserToken = {
    id: number;
    system_id: number;
    user_name: string | null;
    expires_at: string | null;
    needs_reauthed: boolean | null;
    created_at: string;
    system: System;
};

export type System = {
    id: number;
    name: string;
    order: number;
    max_post_length: number;
    image_required: boolean;
    icon: string;
    background_color: string;
    icon_color: string;
    url_slug: string;
};

export type FacebookPages = {
    id: string;
    name: string;
    system_id: number;
    access_token: string;
};
