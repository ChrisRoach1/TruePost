import { format, formatDistanceToNow } from 'date-fns';
import type { UpNextItem } from '@/types/userPosts';

type Props = {
    items?: UpNextItem[];
    subtitle?: string;
};

export function UpNext({ items = [], subtitle }: Props) {
    const computedSubtitle =
        subtitle ??
        `${items.length} ${items.length === 1 ? 'dispatch' : 'dispatches'} queued today`;

    return (
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-baseline gap-2 border-b border-dashed border-border px-5 pt-4 pb-2">
                <span className="font-mono text-[11px] font-semibold text-primary">
                    01
                </span>
                <span className="text-[15px] font-semibold text-foreground">
                    Up
                </span>
                <span className="font-sans text-[15px] text-primary">
                    next
                </span>
            </div>
            <p className="px-5 pt-2 pb-3 text-[12px] text-muted-foreground">
                {computedSubtitle}
            </p>

            {items.length === 0 ? (
                <p className="px-5 pb-5 text-center text-[12px] text-muted-foreground">
                    Nothing queued. Compose a dispatch to get started.
                </p>
            ) : (
                <ul className="divide-y divide-border">
                    {items.map((item) => {
                        const date =
                            typeof item.time === 'string'
                                ? new Date(item.time)
                                : item.time;

                        return (
                            <li
                                key={item.id}
                                className="space-y-2.5 px-5 py-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 flex-col leading-tight">
                                        <span className="font-mono text-[10px] font-semibold tracking-widest text-foreground uppercase">
                                            {formatDistanceToNow(date, {
                                                addSuffix: true,
                                            })}
                                        </span>
                                        <span className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                                            {format(date, 'EEE · HH:mm')}
                                        </span>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                                        <div className="flex items-center gap-1">
                                            {item.channels.map((channel) => (
                                                <span
                                                    key={channel.id}
                                                    className="grid size-5 place-items-center rounded text-white"
                                                    style={{
                                                        backgroundColor:
                                                            channel.background_color,
                                                    }}
                                                    title={channel.name}
                                                >
                                                    <svg
                                                        width="11"
                                                        height="11"
                                                        viewBox="0 0 24 24"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            d={channel.icon}
                                                        />
                                                    </svg>
                                                </span>
                                            ))}
                                        </div>
                                        {item.hasImage && (
                                            <span className="rounded border border-border px-1.5 py-px font-mono text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
                                                + img
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <p className="line-clamp-2 text-[13px] leading-snug text-foreground">
                                    {item.content}
                                </p>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

export default UpNext;
