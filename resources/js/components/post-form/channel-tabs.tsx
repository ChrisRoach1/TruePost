import { cn } from '@/lib/utils';
import type { UserToken } from '@/types';

type Props = {
    accounts: UserToken[];
    activeTab: 'all' | number;
    onSelect: (tab: number) => void;
    getCount: (id: number) => number;
    isModified: (id: number) => boolean;
};

export function ChannelTabs({
    accounts,
    activeTab,
    onSelect,
    getCount,
    isModified,
}: Props) {
    return (
        <div className="mt-3 flex gap-0.5 overflow-x-auto border-b border-border">
            {accounts
                .slice()
                .sort((a, b) => a.system.order - b.system.order)
                .map((account) => {
                    const tabActive = activeTab === account.id;
                    const tabCount = getCount(account.id);
                    const tabOver = tabCount > account.system.max_post_length;

                    return (
                        <button
                            key={account.id}
                            type="button"
                            onClick={() => onSelect(account.id)}
                            className={cn(
                                'relative flex items-center gap-2 border-b-2 px-3 py-2 text-[13px] transition-colors',
                                tabActive
                                    ? 'border-foreground font-semibold text-foreground'
                                    : 'border-transparent font-medium text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <span
                                className="grid size-4 place-items-center"
                                style={{
                                    color: tabActive
                                        ? account.system.background_color
                                        : undefined,
                                }}
                            >
                                <span
                                    className={cn(
                                        'grid place-items-center',
                                        !tabActive &&
                                            'text-muted-foreground/60',
                                    )}
                                >
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d={account.system.icon} />
                                    </svg>
                                </span>
                            </span>
                            {account.system.name}
                            {isModified(account.id) && (
                                <span className="size-1.5 rounded-full bg-primary" />
                            )}
                            {tabOver && (
                                <span className="text-[11px] font-bold text-destructive">
                                    !
                                </span>
                            )}
                        </button>
                    );
                })}
        </div>
    );
}

export default ChannelTabs;
