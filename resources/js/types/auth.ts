export type User = {
    id: number;
    name: string;
    email: string;
    timezone: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
    is_pro_member: boolean;
    is_solo_member: boolean;
    solo_account_limit: number;
    pro_account_limit: number;
    solo_bot_limit: number;
    pro_bot_limit: number;
    is_in_solo_grace_period: boolean;
    is_in_pro_grace_period: boolean;
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
