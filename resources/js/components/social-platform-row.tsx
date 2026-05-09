import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { System, UserToken } from '@/types';

type Props = {
    platform: System;
    accounts: UserToken[];
    onConnect: (platform: System) => void;
    onDisconnect: (account: UserToken) => void;
};

export function SocialPlatformRow({
    platform,
    accounts,
    onConnect,
    onDisconnect,
}: Props) {
    return (
        <div className="flex flex-wrap items-center gap-3 py-2">
            <div className="flex min-w-44 items-center gap-3">
                <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                    style={{
                        backgroundColor: `${platform.background_color}15`,
                    }}
                >
                    <svg
                        className="size-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        style={{ color: platform.icon_color }}
                    >
                        <path d={platform.icon} />
                    </svg>
                </div>
                <span className="text-sm font-medium">{platform.name}</span>
            </div>

            <div className="flex flex-1 flex-wrap items-center gap-2">
                {accounts.map((account) => (
                    <AccountChip
                        key={account.id}
                        account={account}
                        onDisconnect={onDisconnect}
                    />
                ))}

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onConnect(platform)}
                    aria-label={`Connect another ${platform.name} account`}
                    className="size-8 rounded-full"
                >
                    <Plus className="size-4" />
                </Button>
            </div>
        </div>
    );
}

type ChipProps = {
    account: UserToken;
    onDisconnect: (account: UserToken) => void;
};

function AccountChip({ account, onDisconnect }: ChipProps) {
    const label = account.user_name?.trim() || 'Account';

    return (
        <span
            className={cn(
                'group inline-flex items-center gap-1.5 rounded-full border bg-card py-1 pr-1 pl-3 text-xs font-medium',
                'shadow-xs',
            )}
        >
            <span className="max-w-[16rem] truncate">{label}</span>
            <button
                type="button"
                onClick={() => onDisconnect(account)}
                aria-label={`Disconnect ${label}`}
                className={cn(
                    'grid size-5 place-items-center rounded-full text-muted-foreground transition-colors',
                    'hover:bg-destructive/10 hover:text-destructive',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
            >
                <X className="size-3" />
            </button>
        </span>
    );
}
