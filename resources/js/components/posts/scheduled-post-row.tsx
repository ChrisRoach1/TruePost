import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import { Clock, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { userPosts } from '@/types/userPosts';

type Props = {
    post: userPosts;
    onEdit?: () => void;
    onPostNow?: () => void;
};

function formatWhen(date: Date) {
    if (isToday(date)) {
        return `Today · ${format(date, 'HH:mm')}`;
    }

    if (isTomorrow(date)) {
        return `Tomorrow · ${format(date, 'HH:mm')}`;
    }

    return `${format(date, 'EEE')} · ${format(date, 'HH:mm')}`;
}

export function ScheduledPostRow({ post, onEdit, onPostNow }: Props) {
    const date = post.post_at ? new Date(post.post_at) : null;
    const content = post.original_content ?? post.content ?? '';

    return (
        <li className="group relative flex items-stretch gap-4 border-l-2 border-primary/60 bg-card px-5 py-4 transition-colors hover:bg-accent/30">
            <div className="flex w-28 shrink-0 flex-col leading-tight">
                <span className="font-serif text-[15px] text-foreground">
                    {date ? formatWhen(date) : 'Unscheduled'}
                </span>
                {date && (
                    <span className="mt-1 font-mono text-[10px] font-semibold tracking-widest text-primary uppercase">
                        {formatDistanceToNow(date)}
                    </span>
                )}
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-3">
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
                    <span className="ml-1 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                        {post.user_post_systems?.map((ps) => ps.user_token.system.name).join(' · ')}
                        {post.media_url ? ' · + img' : ''}
                    </span>
                </div>

                <p className="min-w-0 flex-1 truncate text-[13px] leading-snug text-foreground/90">
                    {content || <span className="italic text-muted-foreground">No content yet</span>}
                </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onEdit}
                    aria-label="Edit scheduled post"
                    className="text-muted-foreground hover:text-foreground"
                >
                    <Pencil className="size-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Reschedule"
                    className="text-muted-foreground hover:text-foreground"
                >
                    <Clock className="size-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete"
                    className="text-muted-foreground hover:text-destructive"
                >
                    <Trash2 className="size-3.5" />
                </Button>
                <Button size="sm" className="ml-1" onClick={onPostNow}>
                    Post now
                </Button>
            </div>
        </li>
    );
}

export default ScheduledPostRow;
