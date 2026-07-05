import { format, formatDistanceToNow } from 'date-fns';
import ChannelMiniRow from '@/components/posts/channel-mini-row';
import type { userPosts } from '@/types/userPosts';

type Props = {
    post: userPosts;
};

function MetricColumn({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex w-14 flex-col items-end leading-tight">
            <span className="font-serif text-[14px] tabular-nums text-foreground">
                {value}
            </span>
            <span className="font-mono text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
                {label}
            </span>
        </div>
    );
}

function formatMetric(value: number): string {
    return value > 0 ? value.toLocaleString() : '—';
}

export function PublishedPostRow({ post }: Props) {
    const date = post.post_at ? new Date(post.post_at) : null;
    const sharedContent = post.original_content?.trim() ?? '';
    const usesShared = sharedContent.length > 0;
    const channels = post.user_post_systems ?? [];

    const totals = channels.reduce(
        (acc, ps) => {
            acc.impressions += ps.impressions ?? 0;
            acc.likes += ps.likes ?? 0;
            acc.replies += ps.replies ?? 0;

            return acc;
        },
        { impressions: 0, likes: 0, replies: 0 },
    );

    const metrics = (
        <div className="flex shrink-0 items-center gap-5 pl-3">
            <MetricColumn label="Impressions" value={formatMetric(totals.impressions)} />
            <MetricColumn label="Likes" value={formatMetric(totals.likes)} />
            <MetricColumn label="Replies" value={formatMetric(totals.replies)} />
        </div>
    );

    return (
        <li className="group flex items-stretch gap-4 border-b border-border bg-card py-3 transition-colors last:border-b-0 hover:bg-accent/30">
            <div className="flex w-32 shrink-0 flex-col leading-tight pl-5 pt-2">
                <span className="font-serif text-[13px]   text-foreground">
                    {date ? `${formatDistanceToNow(date)} ago` : '—'}
                </span>
                {date && (
                    <span className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                        {format(date, 'MMM d, h:mm a')}
                    </span>
                )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
                {usesShared ? (
                    <ChannelMiniRow
                        systems={channels.map((c) => c.user_token.system)}
                        name={
                            channels.length > 0
                                ? channels.map((c) => c.user_token.system.name).join(' · ')
                                : 'All channels'
                        }
                        text={sharedContent}
                        badge={channels.length > 1 ? "USES SHARED" : ""}
                        trailing={metrics}
                        isFirst
                    />
                ) : channels.length > 0 ? (
                    channels.map((ps, i) => (
                        <ChannelMiniRow
                            key={ps.id}
                            system={ps.user_token.system}
                            text={ps.override_content}
                            trailing={i === 0 ? metrics : null}
                            isFirst={i === 0}
                        />
                    ))
                ) : (
                    <ChannelMiniRow
                        name="No channels"
                        text={null}
                        trailing={metrics}
                        isFirst
                    />
                )}
            </div>
        </li>
    );
}

export default PublishedPostRow;
