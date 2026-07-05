import { Head, Link, router } from '@inertiajs/react';
import { debounce } from '@tanstack/pacer';
import { isPast } from 'date-fns';
import { RefreshCw, Search, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { refreshMetrics } from '@/actions/App/Http/Controllers/UserPostController';
import EditPost from '@/components/edit-post';
import DraftPostRow from '@/components/posts/draft-post-row';
import PublishedPostRow from '@/components/posts/published-post-row';
import ScheduledPostRow from '@/components/posts/scheduled-post-row';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import userPost, { deleteMethod, index, postNow } from '@/routes/userPost';
import type { System, UserToken } from '@/types';
import type { userPosts } from '@/types/userPosts';


type Props = {
    userPosts?: userPosts[];
    connectedAccounts?: UserToken[];
    systems?: System[];
};

type FilterKey = 'all' | 'scheduled' | 'drafts' | 'posted';

function SectionHeader({
    number,
    label,
    accent,
    count,
}: {
    number: string;
    label: string;
    accent: string;
    count: number;
}) {
    return (
        <div className="flex items-baseline gap-2 px-1 pb-3">
            <span className="font-mono text-[11px] font-semibold text-primary">
                {number}
            </span>
            <span className="text-[18px] font-semibold tracking-tight text-foreground">
                {label}
            </span>
            <span className="font-serif text-[18px] text-primary">
                {accent}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
                · {count}
            </span>
        </div>
    );
}

function CountPill({ label, value }: { label: string; value: number }) {
    return (
        <span className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
            <span className="text-foreground tabular-nums">{value}</span> {label}
        </span>
    );
}

function FilterTab({
    active,
    label,
    count,
    onClick,
}: {
    active: boolean;
    label: string;
    count: number;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-colors',
                active
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground',
            )}
        >
            <span>{label}</span>
            <span className={cn('font-mono text-[10px] tabular-nums', active ? 'text-background/70' : 'text-muted-foreground/70')}>
                {count}
            </span>
        </button>
    );
}

export default function Posts({
    userPosts: posts = [],
    connectedAccounts = [],
    systems = [],
}: Props) {
    const [editingPost, setEditingPost] = useState<userPosts | null>(null);
    const [filter, setFilter] = useState<FilterKey>('all');

    const debouncedSearch = debounce((searchTerm: string) => {
        router.get(index({"query": {'search': searchTerm}}), undefined, {preserveState: true, preserveScroll: true})
    }, {
        wait: 500,
      });

    const { scheduled, drafts, published } = useMemo(() => {
        const scheduledList: userPosts[] = [];
        const draftList: userPosts[] = [];
        const publishedList: userPosts[] = [];

        for (const post of posts) {
            if (post.is_draft) {
                draftList.push(post);
                continue;
            }

            const date = post.post_at ? new Date(post.post_at) : null;

            if (date && !isPast(date)) {
                scheduledList.push(post);
            } else if (date) {
                publishedList.push(post);
            } else {
                draftList.push(post);
            }
        }

        scheduledList.sort((a, b) => {
            const aT = a.post_at ? new Date(a.post_at).getTime() : 0;
            const bT = b.post_at ? new Date(b.post_at).getTime() : 0;

            return aT - bT;
        });
        publishedList.sort((a, b) => {
            const aT = a.post_at ? new Date(a.post_at).getTime() : 0;
            const bT = b.post_at ? new Date(b.post_at).getTime() : 0;

            return bT - aT;
        });

        return { scheduled: scheduledList, drafts: draftList, published: publishedList };
    }, [posts]);

    const showScheduled = filter === 'all' || filter === 'scheduled';
    const showDrafts = filter === 'all' || filter === 'drafts';
    const showPublished = filter === 'all' || filter === 'posted';

    function deletePost(postId: number): void {
        router.delete(deleteMethod({userPost: postId}));
    }

    function handlePostNow(postId: number): void {
        router.post(postNow(postId));
    }

    function handleRefreshMetrics(): void {
        router.post(refreshMetrics());
    }

    return (
        <>
            <Head title="Posts" />
            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="mx-auto w-full max-w-6xl space-y-8">
                    <header className="flex items-start justify-between gap-4 pt-2">
                        <div className="space-y-2">
                            <span className="font-mono text-[11px] font-semibold tracking-widest text-primary uppercase">
                                The archive
                            </span>
                            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                                Every <span className="font-serif text-primary">dispatch</span> you've ever made.
                            </h1>
                            <div className="flex items-center gap-4 pt-1">
                                <CountPill label="All" value={posts.length} />
                                <CountPill label="Drafts" value={drafts.length} />
                                <CountPill label="Scheduled" value={scheduled.length} />
                                <CountPill label="Posted" value={published.length} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={handleRefreshMetrics}>
                                <RefreshCw className="size-3.5" />
                                Refresh metrics
                            </Button>
                            <Button asChild>
                                <Link href={dashboard().url}>
                                    <Send className="size-3.5" />
                                    New post
                                </Link>
                            </Button>
                        </div>
                    </header>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-y border-dashed border-border py-3">
                        <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
                            <FilterTab
                                active={filter === 'all'}
                                label="All"
                                count={posts.length}
                                onClick={() => setFilter('all')}
                            />
                            <FilterTab
                                active={filter === 'scheduled'}
                                label="Scheduled"
                                count={scheduled.length}
                                onClick={() => setFilter('scheduled')}
                            />
                            <FilterTab
                                active={filter === 'drafts'}
                                label="Drafts"
                                count={drafts.length}
                                onClick={() => setFilter('drafts')}
                            />
                            <FilterTab
                                active={filter === 'posted'}
                                label="Posted"
                                count={published.length}
                                onClick={() => setFilter('posted')}
                            />
                        </div>

                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search posts"
                                className="h-8 w-56 pl-8 text-[12px]"
                                onChange={(e) => debouncedSearch(e.target.value)}
                            />
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border px-1 font-mono text-[9px] text-muted-foreground">
                                /
                            </span>
                        </div>
                    </div>

                    {showScheduled && scheduled.length > 0 && (
                        <section>
                            <SectionHeader
                                number="01"
                                label="Scheduled"
                                accent="& queued"
                                count={scheduled.length}
                            />
                            <ul className="overflow-hidden rounded-xl border border-border bg-card shadow-sm divide-y divide-border">
                                {scheduled.map((post) => (
                                    <ScheduledPostRow
                                        key={post.id}
                                        post={post}
                                        onEdit={() => setEditingPost(post)}
                                        onDelete={() => deletePost(post.id)}
                                        onPostNow={() => handlePostNow(post.id)}
                                    />
                                ))}
                            </ul>
                        </section>
                    )}

                    {showDrafts && drafts.length > 0 && (
                        <section>
                            <SectionHeader
                                number="02"
                                label="In"
                                accent="progress"
                                count={drafts.length}
                            />
                            <ul className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                                {drafts.map((post, i) => (
                                    <DraftPostRow
                                        key={post.id}
                                        post={post}
                                        index={i}
                                        onEdit={() => setEditingPost(post)}
                                        onDelete={() => deletePost(post.id)}
                                    />
                                ))}
                            </ul>
                        </section>
                    )}

                    {showPublished && published.length > 0 && (
                        <section>
                            <SectionHeader
                                number="03"
                                label="Recently"
                                accent="published"
                                count={published.length}
                            />
                            <ul className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                                {published.map((post) => (
                                    <PublishedPostRow
                                        key={post.id}
                                        post={post}
                                    />
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            </div>

            {editingPost && (
                <EditPost
                    post={editingPost}
                    connectedAccounts={connectedAccounts}
                    systems={systems}
                    open={!!editingPost}
                    onOpenChange={(o) => {
                        if (!o) {
                            setEditingPost(null);
                        }
                    }}
                />
            )}
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
