import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import { Clock, Pencil, Trash2 } from 'lucide-react';
import PostCard from '@/components/posts/post-card';
import { Button } from '@/components/ui/button';
import type { userPosts } from '@/types/userPosts';

type Props = {
    post: userPosts;
    onEdit?: () => void;
    onDelete?: () => void;
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

export function ScheduledPostRow({ post, onEdit, onDelete, onPostNow }: Props) {
    const date = post.post_at ? new Date(post.post_at) : null;
    const channels = post.user_post_systems ?? [];

    return (
        <PostCard
            post={post}
            timestamp={
                <>
                    <span className="font-sans text-[15px] text-foreground">
                        {date ? formatWhen(date) : 'Unscheduled'}
                    </span>
                    {date && (
                        <span className="mt-1 font-mono text-[10px] font-semibold tracking-widest text-primary uppercase">
                            IN {formatDistanceToNow(date).toUpperCase()}
                        </span>
                    )}
                </>
            }
            summary={
                channels.length > 0 ? (
                    <span className="font-mono text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
                        Queued on {channels.length}{' '}
                        {channels.length === 1 ? 'channel' : 'channels'}
                    </span>
                ) : null
            }
            actions={
                <>
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
                        onClick={onDelete}
                        aria-label="Delete"
                        className="text-muted-foreground hover:text-destructive"
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                    <Button size="sm" className="ml-1" onClick={onPostNow}>
                        Post now
                    </Button>
                </>
            }
            channelStatus={() => ({ label: 'Queued', tone: 'default' })}
        />
    );
}

export default ScheduledPostRow;
