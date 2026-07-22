import { SystemIcon } from '@/components/system-icon';
import { cn } from '@/lib/utils';
import type { UserToken } from '@/types';

type Props = {
    account: UserToken;
    selected: boolean;
    count: number;
    onToggle: () => void;
};

export function ChannelCard({ account, selected, count, onToggle }: Props) {
    const limit = account.system.max_post_length;
    const over = count > limit;
    const left = Math.max(0, limit - count);

    return (
        <button
            type="button"
            onClick={onToggle}
            className={cn(
                'group relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                selected
                    ? 'border-foreground bg-card shadow-xs'
                    : 'border-border bg-card opacity-55 hover:opacity-90',
            )}
        >
            <span
                className="grid size-10 shrink-0 place-items-center rounded-md text-white"
                style={{ backgroundColor: account.system.background_color }}
            >
                <SystemIcon icon={account.system.icon} size={20} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-[13px] font-semibold text-foreground">
                    {account.system.name}
                </span>
                {account.user_name && (
                    <span className="truncate text-[11px] text-muted-foreground">
                        @{account.user_name}
                    </span>
                )}
            </span>
            <span className="flex shrink-0 flex-col items-end leading-none">
                <span
                    className={cn(
                        'text-xl font-semibold tabular-nums',
                        over ? 'text-destructive' : 'text-foreground',
                    )}
                >
                    {over
                        ? `−${(count - limit).toLocaleString()}`
                        : left.toLocaleString()}
                </span>
                <span className="mt-1 text-[9px] font-semibold tracking-widest text-muted-foreground">
                    LEFT
                </span>
            </span>
            <span className="absolute top-2 right-2 size-2 rounded-full bg-emerald-500 ring-2 ring-card" />
        </button>
    );
}

export default ChannelCard;
