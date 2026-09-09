import { format, formatDistanceToNow } from 'date-fns';
import ChannelMetrics from '@/components/posts/channel-metrics';
import PostCard from '@/components/posts/post-card';
import type { userPosts } from '@/types/userPosts';

type Props = {
    post: userPosts;
};

export function PublishedPostRow({ post }: Props) {
    const date = post.post_at ? new Date(post.post_at) : null;
    const channels = post.user_post_systems ?? [];
    const publishedCount = channels.filter((ps) => !ps.failed_to_post).length;

    return (
        <PostCard
            post={post}
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
                channels.length > 0 ? (
                    <span className="font-mono text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
                        Published on {publishedCount} of {channels.length}
                    </span>
                ) : null
            }
            channelStatus={() => ({ label: 'Published', tone: 'default' })}
            channelTrailing={(channel) => <ChannelMetrics channel={channel} />}
        />
    );
}

export default PublishedPostRow;
