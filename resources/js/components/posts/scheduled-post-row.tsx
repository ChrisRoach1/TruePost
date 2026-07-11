import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import { Clock, Pencil, Trash2 } from 'lucide-react';
import ChannelMiniRow from '@/components/posts/channel-mini-row';
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
    const sharedContent = post.original_content?.trim() ?? '';
    const usesShared = sharedContent.length > 0;
    const channels = post.user_post_systems ?? [];

    const actions = (
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
    );

    return (
        <li className="group relative flex items-stretch gap-4 bg-card py-3 transition-colors hover:bg-accent/30">
            <div className="flex w-32 shrink-0 flex-col leading-tight pl-5 pt-2">
                <span className="font-sans text-[15px] text-foreground">
                    {date ? formatWhen(date) : 'Unscheduled'}
                </span>
                {date && (
                    <span className="mt-1 font-mono text-[10px] font-semibold tracking-widest text-primary uppercase">
                        IN {formatDistanceToNow(date).toUpperCase()}
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
                        badge="USES SHARED"
                        trailing={actions}
                        isFirst
                    />
                ) : channels.length > 0 ? (
                    channels.map((ps, i) => (
                        <ChannelMiniRow
                            key={ps.id}
                            system={ps.user_token.system}
                            text={ps.override_content}
                            trailing={i === 0 ? actions : null}
                            isFirst={i === 0}
                        />
                    ))
                ) : (
                    <ChannelMiniRow
                        name="No channels"
                        text={null}
                        trailing={actions}
                        isFirst
                    />
                )}
            </div>
        </li>
    );
}

export default ScheduledPostRow;
