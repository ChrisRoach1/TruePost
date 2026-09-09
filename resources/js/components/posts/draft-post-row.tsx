import { formatDistanceToNow } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import PostCard from '@/components/posts/post-card';
import { Button } from '@/components/ui/button';
import type { userPosts } from '@/types/userPosts';

type Props = {
    post: userPosts;
    index: number;
    onEdit?: () => void;
    onDelete?: () => void;
};

export function DraftPostRow({ post, index, onEdit, onDelete }: Props) {
    const editedAt = post.created_at ? new Date(post.created_at) : null;

    return (
        <PostCard
            post={post}
            timestamp={
                <>
                    <span className="font-sans text-[15px] text-foreground">
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
                </>
            }
            actions={
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
            }
            channelStatus={() => ({ label: 'Draft', tone: 'default' })}
        />
    );
}

export default DraftPostRow;
