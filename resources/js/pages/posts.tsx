import { Head, Link } from '@inertiajs/react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { AlertTriangle, CalendarDays, FileText, Plus, Send, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { dashboard } from '@/routes';
import userPost from '@/routes/userPost';
import type { userPosts } from '@/types/userPosts';

type Props = {
    userPosts?: userPosts[];
};

function PlatformPill({
    system,
    failed = false,
}: {
    system: { icon: string; background_color: string; icon_color: string; name: string };
    failed?: boolean;
}) {
    if (failed) {
        return (
            <div
                className="relative flex items-center justify-center rounded-md size-7 bg-destructive/10 ring-1 ring-destructive/40"
                title={`${system.name} — failed to post`}
            >
                <svg className="size-3.5 text-destructive" viewBox="0 0 24 24" fill="currentColor">
                    <path d={system.icon} />
                </svg>
                <span className="absolute -right-1 -top-1 flex size-3 items-center justify-center rounded-full bg-destructive ring-2 ring-background">
                    <AlertTriangle className="size-2 text-destructive-foreground" strokeWidth={3} />
                </span>
            </div>
        );
    }

    return (
        <div
            className="flex items-center justify-center rounded-md size-7"
            style={{ backgroundColor: `${system.background_color}18` }}
            title={system.name}
        >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor" style={{ color: system.icon_color }}>
                <path d={system.icon} />
            </svg>
        </div>
    );
}

function PostCard({ post, index }: { post: userPosts; index: number }) {

    const posted = isPast(new Date(post.post_at));
    const scheduleDate = new Date(post.post_at);
    const failedSystems = post.user_post_systems?.filter((ps) => ps.failed_to_post) ?? [];
    const hasFailures = failedSystems.length > 0;
    return (
        <Card
            className={`group relative flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-3 ${
                hasFailures ? 'ring-1 ring-destructive/30' : ''
            }`}
            style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }}
        >
            <div
                className={`h-1 w-full ${
                    hasFailures ? 'bg-destructive' : posted ? 'bg-muted-foreground/15' : 'bg-primary'
                }`}
            />

            <CardContent className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        {post.user_post_systems?.map((ps) => (
                            <PlatformPill
                                key={ps.id}
                                system={ps.user_token.system}
                                failed={ps.failed_to_post}
                            />
                        ))}
                    </div>

                    {hasFailures ? (
                        <Badge
                            variant="outline"
                            className="border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/15"
                        >
                            <AlertTriangle className="size-3" />
                            {failedSystems.length} failed
                        </Badge>
                    ) : (
                        <Badge
                            variant="outline"
                            className={
                                posted
                                    ? 'border-muted-foreground/20 bg-muted/50 text-muted-foreground'
                                    : 'border-primary/20 bg-primary/5 text-primary dark:border-primary/30 dark:bg-primary/10'
                            }
                        >
                            {posted ? 'Posted' : 'Scheduled'}
                        </Badge>
                    )}
                </div>

                {hasFailures && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                        <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                        <div className="leading-snug">
                            <span className="font-medium">Failed to post</span> on{' '}
                            <span className="font-medium">
                                {failedSystems.map((ps) => ps.user_token.system.name).join(', ')}
                            </span>
                        </div>
                    </div>
                )}

                <p className="flex-1 text-sm leading-relaxed line-clamp-4 text-foreground/90">
                    {post.content}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="size-3.5 shrink-0" />
                            <span>{format(scheduleDate, 'MMM d, yyyy')} at {format(scheduleDate, 'h:mm a')}</span>
                        </div>
                        <div className="text-xs text-muted-foreground/70">
                            {formatDistanceToNow(scheduleDate, { addSuffix: true })}
                        </div>
                    </div>

                    {!posted && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="size-3.5" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/5 ring-1 ring-primary/10 mb-5">
                <FileText className="size-7 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight mb-1.5">No posts yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
                Create your first post and schedule it to go live across your connected platforms.
            </p>
            <Button asChild>
                <Link href={dashboard().url}>
                    <Plus className="size-4" />
                    Create your first post
                </Link>
            </Button>
        </div>
    );
}

export default function Posts({ userPosts: posts = [] }: Props) {
    return (
        <>
            <Head title="Posts" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="mx-auto w-full max-w-6xl space-y-6">
                    <div className="flex items-end justify-between gap-4">
                        {posts.length > 0 && (
                            <Button asChild size="sm">
                                <Link href={dashboard().url}>
                                    <Send className="size-3.5" />
                                    New Post
                                </Link>
                            </Button>
                        )}
                    </div>

                    {posts.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {posts.map((post, i) => (
                                <PostCard key={post.id} post={post} index={i} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Posts.layout = {
    breadcrumbs: [
        {
            title: 'Posts',
            href: userPost.index(),
        },
    ],
};
