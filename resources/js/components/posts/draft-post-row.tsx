import { formatDistanceToNow } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { userPosts } from '@/types/userPosts';

type Props = {
    post: userPosts;
    index: number;
    onEdit?: () => void;
    onDelete?: () => void;
};

export function DraftPostRow({ post, index, onEdit, onDelete }: Props) {
    const content = post.original_content ?? post.content ?? '';
    const [titleRaw, ...rest] = content.split('\n');
    const title = titleRaw?.trim();
    const body = rest.join(' ').trim();
    const charCount = content.length;
    const editedAt = post.created_at ? new Date(post.created_at) : null;
    const hasChannels = (post.user_post_systems?.length ?? 0) > 0;

    return (
        <li className="group flex items-center gap-4 border-b border-dashed border-border px-5 py-3 last:border-b-0 hover:bg-accent/30">
            <span className="w-10 shrink-0 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                D-{String(index + 1).padStart(2, '0')}
            </span>

            <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-[13px] font-semibold text-foreground">
                    {title || <span className="font-serif italic font-normal text-muted-foreground">Untitled</span>}
                </span>
                {body && (
                    <span className="mt-0.5 truncate text-[12px] text-muted-foreground">
                        {body}
                    </span>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-3">
                <div className="flex items-center gap-1">
                    {hasChannels ? (
                        post.user_post_systems?.map((ps) => (
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
                        ))
                    ) : (
                        <span className="font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                            No channels
                        </span>
                    )}
                </div>

                <span className="font-mono text-[10px] font-semibold tabular-nums tracking-widest text-foreground uppercase">
                    {charCount}c
                </span>

                {editedAt && (
                    <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                        Edited {formatDistanceToNow(editedAt)} ago
                    </span>
                )}

                <div className="flex items-center gap-0.5">
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
                </div>
            </div>
        </li>
    );
}

export default DraftPostRow;
