
export type UserToken = {
    system_id: number;
    id: number;
    system: System;
}

export type System = {
    id: number;
    name: string;
    icon: string;
    background_color: string;
    icon_color: string;
    url_slug: string;
}
