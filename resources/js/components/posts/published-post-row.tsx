import { format, formatDistanceToNow } from 'date-fns';
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

export function PublishedPostRow({ post }: Props) {
    const date = post.post_at ? new Date(post.post_at) : null;
    const content = post.original_content ?? post.content ?? '';

    return (
        <li className="group flex items-center gap-4 border-b border-dashed border-border px-5 py-3 last:border-b-0 hover:bg-accent/30">
            <div className="flex w-28 shrink-0 flex-col leading-tight">
                <span className="font-serif text-[13px] italic text-foreground">
                    {date ? `${formatDistanceToNow(date)} ago` : '—'}
                </span>
                {date && (
                    <span className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                        {format(date, 'MMM d, h:mm a')}
                    </span>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
                {post.user_post_systems?.map((ps) => (
                    <span
                        key={ps.id}
                        className="grid size-5 place-items-center rounded text-white"
                        style={{ backgroundColor: ps.user_token.system.background_color }}
                        title={ps.user_token.system.name}
                    >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                            <path d={ps.user_token.system.icon} />
                        </svg>
                    </span>
                ))}
                {post.media_url && (
                    <span className="rounded border border-border px-1.5 py-px font-mono text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
                        img
                    </span>
                )}
            </div>

            <p className="min-w-0 flex-1 truncate text-[13px] leading-snug text-foreground/90">
                {content || <span className="italic text-muted-foreground">No content</span>}
            </p>

            <div className="flex shrink-0 items-center gap-5">
                <MetricColumn label="Impressions" value="—" />
                <MetricColumn label="Likes" value="—" />
                <MetricColumn label="Replies" value="—" />
            </div>

        </li>
    );
}

export default PublishedPostRow;
