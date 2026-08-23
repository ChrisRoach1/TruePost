import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { System, ConnectedAccount } from '@/types';

type Props = {
    account: ConnectedAccount;
    platform: System;
    onReconnect: (platform: System) => void;
    onDisconnect: (account: ConnectedAccount) => void;
};

export function AccountCard({
    account,
    platform,
    onReconnect,
    onDisconnect,
}: Props) {
    const connectedAt = new Date(account.created_at);

    const handle = account.username?.trim() || 'Account';

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
                                'bg-emerald-500',
                            )}
                            aria-hidden
                        />
                        <div className="flex min-w-0 flex-col leading-tight">
                            <span
                                className={cn(
                                    'text-[12px] font-medium',
                                    'text-foreground'
                                )}
                            >
                                Connected {formatDistanceToNow(connectedAt)} ago
                            </span>
                        </div>
                    </div>

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
