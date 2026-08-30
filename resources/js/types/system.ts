export type ConnectedAccount = {
    id: number;
    system_id: number;
    username: string | null;
    display_name: string | null;
    disconnected_at: string | null;
    created_at: string;
    system: System;
}

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
    can_tag: boolean;
    can_collaborate: boolean;
    can_crosspost: boolean;
};
