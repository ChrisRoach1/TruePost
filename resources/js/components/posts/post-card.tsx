import type { ReactNode } from 'react';
import ChannelMiniRow from '@/components/posts/channel-mini-row';
import type { RowTone } from '@/components/posts/channel-mini-row';
import { cn } from '@/lib/utils';
import type { userPosts, userPostSystems } from '@/types/userPosts';

type ChannelStatus = {
    label: string;
    tone: RowTone;
};

type Props = {
    post: userPosts;
    timestamp: ReactNode;
    summary?: ReactNode;
    actions?: ReactNode;
    tone?: RowTone;
    channelStatus: (channel: userPostSystems) => ChannelStatus;
    channelError?: (channel: userPostSystems) => string | null | undefined;
    channelTrailing?: (channel: userPostSystems) => ReactNode;
};

export function PostCard({
    post,
    timestamp,
    summary,
    actions,
    tone = 'default',
    channelStatus,
    channelError,
    channelTrailing,
}: Props) {
    const sharedContent = post.original_content?.trim() ?? '';
    const channels = post.user_post_systems ?? [];

    return (
        <li
            className={cn(
                'overflow-hidden rounded-xl border border-border bg-card shadow-sm',
                tone === 'danger' &&
                    'border-destructive/40 border-l-2 border-l-destructive/60 bg-destructive/3',
            )}
        >
            <div className="flex items-start gap-4 px-5 py-3">
                <div className="flex w-36 shrink-0 flex-col leading-tight pt-0.5">
                    {timestamp}
                </div>

                <div className="min-w-0 flex-1">{summary}</div>

                <div className="flex shrink-0 items-center gap-1">
                    {actions}
                </div>
            </div>

            <div className="h-3 border-t border-dashed border-border/60" />

            {channels.length > 0 ? (
                channels.map((channel, i) => {
                    const status = channelStatus(channel);

                    return (
                        <ChannelMiniRow
                            key={channel.id}
                            system={channel.connected_account.system}
                            text={channel.override_content ?? sharedContent}
                            error={channelError?.(channel)}
                            status={status.label}
                            tone={status.tone}
                            trailing={channelTrailing?.(channel)}
                            isFirst={i === 0}
                        />
                    );
                })
            ) : (
                <ChannelMiniRow name="No channels" text={null} isFirst />
            )}
        </li>
    );
}

export default PostCard;
