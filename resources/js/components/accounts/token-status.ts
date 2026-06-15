import type { UserToken } from '@/types';

export type TokenStatus = 'healthy' | 'expiring' | 'needs_attention';

const EXPIRING_WINDOW_DAYS = 7;
const DAY_MS = 1000 * 60 * 60 * 24;

export function getTokenStatus(token: UserToken, now: Date = new Date()): TokenStatus {
    if (token.needs_reauthed) {
        return 'needs_attention';
    }

    if (!token.expires_at) {
        return 'healthy';
    }

    const expiresAt = new Date(token.expires_at);
    const msUntilExpiry = expiresAt.getTime() - now.getTime();

    if (msUntilExpiry <= 0) {
        return 'needs_attention';
    }

    if (msUntilExpiry <= EXPIRING_WINDOW_DAYS * DAY_MS) {
        return 'expiring';
    }

    return 'healthy';
}

export function daysUntil(date: string | null, now: Date = new Date()): number | null {
    if (!date) {
        return null;
    }

    const target = new Date(date);
    return Math.ceil((target.getTime() - now.getTime()) / DAY_MS);
}
