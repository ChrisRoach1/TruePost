import { formatDistanceToNow } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import ChannelMiniRow from '@/components/posts/channel-mini-row';
import { Button } from '@/components/ui/button';
import type { userPosts } from '@/types/userPosts';

type Props = {
    post: userPosts;
    index: number;
    onEdit?: () => void;
    onDelete?: () => void;
};

export function DraftPostRow({ post, index, onEdit, onDelete }: Props) {
    const sharedContent = post.original_content?.trim() ?? '';
    const usesShared = sharedContent.length > 0;
    const channels = post.user_post_systems ?? [];
    const editedAt = post.created_at ? new Date(post.created_at) : null;

    const actions = (
        <>
            <Button
                variant="ghost"
                size="icon-sm"
                onClick={onEdit}
                aria-label="Edit draft"
                className="text-muted-foreground hover:text-foreground"
            >
                <Pencil className="size-3.5" />
            </Button>
            <Button
                variant="ghost"
                size="icon-sm"
                onClick={onDelete}
                aria-label="Delete draft"
                className="text-muted-foreground hover:text-destructive"
            >
                <Trash2 className="size-3.5" />
            </Button>
        </>
    );

    return (
        <li className="group flex items-stretch gap-4 border-b border-border bg-card py-3 transition-colors last:border-b-0 hover:bg-accent/30">
            <div className="flex w-32 shrink-0 flex-col leading-tight pl-5 pt-2">
                <span className="font-serif text-[15px] text-foreground">
                    Draft
                </span>
                <span className="mt-1 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    D-{String(index + 1).padStart(2, '0')}
                    {editedAt && (
                        <>
                            {' · '}
                            {formatDistanceToNow(editedAt)} ago
                        </>
                    )}
                </span>
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

export default DraftPostRow;
