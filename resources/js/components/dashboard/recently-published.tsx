import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Minus, TrendingUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { RecentlyPublishedItem } from '@/types/userPosts';

type Props = {
    items?: RecentlyPublishedItem[];
    /** Override the subtitle text. Defaults to "last 72 hours". */
    subtitle?: string;
};

export function RecentlyPublished({
    items = [],
    subtitle = 'last 72 hours',
}: Props) {
    return (
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-baseline gap-2 border-b border-dashed border-border px-5 pt-4 pb-2">
                <span className="font-mono text-[11px] font-semibold text-primary">
                    02
                </span>
                <span className="text-[15px] font-semibold text-foreground">
                    Recently
                </span>
                <span className="font-sans text-[15px] text-primary">
                    published
                </span>
            </div>
            <p className="px-5 pt-2 pb-3 text-[12px] text-muted-foreground">
                {subtitle}
            </p>

            {items.length === 0 ? (
                <p className="px-5 pb-5 text-center text-[12px] text-muted-foreground">
                    Nothing published yet.
                </p>
            ) : (
                <ul className="divide-y divide-border">
                    {items.map((item) => {
                        const date =
                            typeof item.time === 'string'
                                ? new Date(item.time)
                                : item.time;
                        const TrendIcon =
                            item.trend === 'flat' ? Minus : TrendingUp;

                        return (
                            <li key={item.id} className="space-y-2.5 px-5 py-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                                        {formatDistanceToNow(date, {
                                            addSuffix: true,
                                        })}
                                    </span>
                                    <TrendIcon
                                        className={cn(
                                            'size-3.5',
                                            item.trend === 'flat'
                                                ? 'text-muted-foreground/60'
                                                : 'text-primary',
                                        )}
                                    />
                                </div>

                                <p className="text-[13px] leading-snug text-foreground">
                                    {item.content}
                                </p>

                                {item.metrics.length > 0 && (
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-dashed border-border pt-2.5">
                                        {item.metrics.map((metric) => (
                                            <div
                                                key={metric.system.id}
                                                className="flex flex-col gap-0.5"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className="size-1.5 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                metric.system
                                                                    .background_color,
                                                        }}
                                                    />
                                                    <span className="font-mono text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
                                                        {metric.system.name}
                                                    </span>
                                                </div>
                                                <div className="mt-0.5 flex items-center gap-3 font-mono text-[10px] tabular-nums text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="size-3" />
                                                        {metric.likes.toLocaleString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageCircle className="size-3" />
                                                        {metric.replies.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

export default RecentlyPublished;
