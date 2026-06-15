import { format, formatDistanceToNow } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { System, UserToken } from '@/types';
import { daysUntil, getTokenStatus, type TokenStatus } from './token-status';

type Props = {
    account: UserToken;
    platform: System;
    onReconnect: (platform: System) => void;
    onDisconnect: (account: UserToken) => void;
    onRefresh: (account: UserToken) => void;
};

const statusDotClass: Record<TokenStatus, string> = {
    healthy: 'bg-emerald-500',
    expiring: 'bg-amber-500',
    needs_attention: 'bg-rose-500',
};

const statusLabel: Record<TokenStatus, string> = {
    healthy: 'Connection healthy',
    expiring: 'Token expiring',
    needs_attention: 'Needs attention',
};

export function AccountCard({
    account,
    platform,
    onReconnect,
    onDisconnect,
    onRefresh,
}: Props) {
    const status = getTokenStatus(account);
    const days = daysUntil(account.expires_at);
    const expiresAt = account.expires_at ? new Date(account.expires_at) : null;
    const connectedAt = new Date(account.created_at);

    const handle = account.user_name?.trim() || 'Account';

    let microLine: string;
    if (status === 'needs_attention') {
        microLine = expiresAt
            ? 'Reconnect to restore dispatch'
            : 'Reconnect to restore dispatch';
    } else if (status === 'expiring' && days !== null) {
        const dayWord = days === 1 ? 'day' : 'days';
        microLine = days <= 0 ? 'Refresh now' : `Refresh in ${days} ${dayWord}`;
    } else if (expiresAt) {
        microLine = `Refreshes ${format(expiresAt, 'MMM d')} · connected ${formatDistanceToNow(connectedAt)} ago`;
    } else {
        microLine = `Connected ${formatDistanceToNow(connectedAt)} ago`;
    }

    const showRefresh = status === 'expiring' || status === 'needs_attention';

    return (
        <div className="flex h-full flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                        {handle}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-dashed border-border pt-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <span
                            className={cn(
                                'inline-block size-1.5 shrink-0 rounded-full',
                                statusDotClass[status],
                            )}
                            aria-hidden
                        />
                        <div className="flex min-w-0 flex-col leading-tight">
                            <span
                                className={cn(
                                    'text-[12px] font-medium',
                                    status === 'healthy'
                                        ? 'text-foreground'
                                        : status === 'expiring'
                                          ? 'text-amber-700 dark:text-amber-400'
                                          : 'text-rose-700 dark:text-rose-400',
                                )}
                            >
                                {statusLabel[status]}
                            </span>
                            <span className="truncate font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                                {microLine}
                            </span>
                        </div>
                    </div>

                    {showRefresh && (
                        <Button
                            type="button"
                            size="xs"
                            variant={status === 'needs_attention' ? 'destructive' : 'default'}
                            onClick={() => onRefresh(account)}
                            className="shrink-0"
                        >
                            <RefreshCw />
                            Refresh
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-end gap-2">
                <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => onReconnect(platform)}
                >
                    Reconnect
                </Button>
                <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => onDisconnect(account)}
                    className="text-muted-foreground hover:text-destructive"
                >
                    Disconnect
                </Button>
            </div>
        </div>
    );
}

export default AccountCard;
