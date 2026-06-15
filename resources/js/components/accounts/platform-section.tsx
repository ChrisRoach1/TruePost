import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { System, UserToken } from '@/types';
import { AccountCard } from './account-card';
import { getTokenStatus } from './token-status';

type Props = {
    platform: System;
    accounts: UserToken[];
    index: number;
    onConnect: (platform: System) => void;
    onDisconnect: (account: UserToken) => void;
    onRefresh: (account: UserToken) => void;
};

export function PlatformSection({
    platform,
    accounts,
    index,
    onConnect,
    onDisconnect,
    onRefresh,
}: Props) {
    const indexLabel = String(index + 1).padStart(2, '0');
    const countLabel = `${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'}`;
    const needsAttention = accounts.some(
        (account) => getTokenStatus(account) === 'needs_attention',
    );

    return (
        <section className="space-y-3">
            <header className="flex items-center justify-between gap-3 border-b border-dashed border-border pb-3">
                <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] font-semibold text-primary">
                        #{indexLabel}
                    </span>
                    <div
                        className="flex size-7 shrink-0 items-center justify-center rounded-md"
                        style={{
                            backgroundColor: `${platform.background_color}15`,
                        }}
                    >
                        <svg
                            className="size-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            style={{ color: platform.icon_color }}
                        >
                            <path d={platform.icon} />
                        </svg>
                    </div>
                    <span className="text-[18px] font-semibold tracking-tight text-foreground">
                        {platform.name}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                        · {countLabel}
                    </span>
                    {needsAttention && (
                        <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-amber-700 uppercase dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-400">
                            Needs attention
                        </span>
                    )}
                </div>
            </header>

            <div className="grid gap-3 sm:grid-cols-2">
                {accounts.map((account) => (
                    <AccountCard
                        key={account.id}
                        account={account}
                        platform={platform}
                        onReconnect={onConnect}
                        onDisconnect={onDisconnect}
                        onRefresh={onRefresh}
                    />
                ))}

                <button
                    type="button"
                    onClick={() => onConnect(platform)}
                    className={cn(
                        'group flex min-h-[148px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-transparent p-4 text-center transition-colors',
                        'hover:border-foreground/40 hover:bg-muted/40',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    )}
                >
                    <span className="grid size-7 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors group-hover:text-foreground">
                        <Plus className="size-3.5" />
                    </span>
                    <span className="font-serif text-[15px] italic text-foreground/80">
                        Add another {platform.name} account
                    </span>
                    <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                        OAuth · 30 seconds
                    </span>
                </button>
            </div>
        </section>
    );
}

export default PlatformSection;
