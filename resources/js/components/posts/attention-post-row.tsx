import { format, formatDistanceToNow } from 'date-fns';
import { AlertTriangle } from 'lucide-react';
import ChannelMetrics from '@/components/posts/channel-metrics';
import PostCard from '@/components/posts/post-card';
import { Button } from '@/components/ui/button';
import type { userPosts } from '@/types/userPosts';

type Props = {
    post: userPosts;
    onRetry?: () => void;
};

export function AttentionPostRow({ post, onRetry }: Props) {
    const date = post.post_at ? new Date(post.post_at) : null;
    const channels = post.user_post_systems ?? [];
    const failedCount = channels.filter((ps) => ps.failed_to_post).length;
    const publishedCount = channels.length - failedCount;

    return (
        <PostCard
            post={post}
            tone="danger"
            timestamp={
                <>
                    <span className="font-sans text-[13px] text-foreground">
                        {date ? `${formatDistanceToNow(date)} ago` : '—'}
                    </span>
                    {date && (
                        <span className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                            {format(date, 'MMM d, h:mm a')}
                        </span>
                    )}
                </>
            }
            summary={
                <span className="flex items-center gap-1.5 font-mono text-[9px] font-semibold tracking-widest text-red-600 uppercase dark:text-red-100">
                    <AlertTriangle className="size-3" />
                    Published on {publishedCount} of {channels.length} ·{' '}
                    {failedCount} failed
                </span>
            }
            channelStatus={(channel) =>
                channel.failed_to_post
                    ? { label: 'Failed', tone: 'danger' }
                    : { label: 'Published', tone: 'default' }
            }
            channelError={(channel) =>
                channel.failed_to_post ? channel.error_message : null
            }
            channelTrailing={(channel) =>
                channel.failed_to_post ? (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={onRetry}
                    >
                        Retry
                    </Button>
                ) : (
                    <ChannelMetrics channel={channel} />
                )
            }
        />
    );
}

export default AttentionPostRow;
