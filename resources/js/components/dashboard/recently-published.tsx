import { formatDistanceToNow } from 'date-fns';
import { Heart, Eye, MessageCircle, Minus, TrendingUp } from 'lucide-react';
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
                        const channels = item.user_post_systems ?? [];
                        const totals = channels.reduce(
                            (acc, ps) => {
                                acc.impressions += ps.impressions ?? 0;
                                acc.likes += ps.likes ?? 0;
                                acc.replies += ps.replies ?? 0;

                                return acc;
                            },
                            { impressions: 0, likes: 0, replies: 0 },
                        );

                        return (
                            <li key={item.id} className="space-y-2.5 px-5 py-4">
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                                        {formatDistanceToNow(date, {
                                            addSuffix: true,
                                        })}
                                    </span>
                                </div>

                                <p className="text-[13px] leading-snug text-foreground">
                                    {item.content}
                                </p>

                                {channels.length > 0 && (
                                    <div className="flex items-center justify-between gap-3 border-t border-dashed border-border pt-2.5">
                                        <div className="flex items-center gap-1.5">
                                            {channels.map((ps) => (
                                                <span
                                                    key={ps.id}
                                                    className="size-1.5 rounded-full"
                                                    title={ps.user_token.system.name}
                                                    style={{
                                                        backgroundColor:
                                                            ps.user_token.system
                                                                .background_color,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-3 font-mono text-[10px] tabular-nums text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Eye className="size-3" />
                                                {totals.impressions > 0
                                                    ? totals.impressions.toLocaleString()
                                                    : '—'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Heart className="size-3" />
                                                {totals.likes > 0
                                                    ? totals.likes.toLocaleString()
                                                    : '—'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageCircle className="size-3" />
                                                {totals.replies > 0
                                                    ? totals.replies.toLocaleString()
                                                    : '—'}
                                            </span>
                                        </div>
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
