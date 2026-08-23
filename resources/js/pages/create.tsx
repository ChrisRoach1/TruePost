import { Head } from '@inertiajs/react';
import CreatePost from '@/components/create-post';
import RecentlyPublished from '@/components/dashboard/recently-published';
import { create } from '@/routes';
import type { ConnectedAccount, System } from '@/types';
import type { RecentlyPublishedItem } from '@/types/userPosts';

type Props = {
    connectedAccounts?: ConnectedAccount[];
    systems?: System[];
    recentlyPublishedItems: RecentlyPublishedItem[];
};

export default function Dashboard({
    connectedAccounts = [],
    systems = [],
    recentlyPublishedItems = [],
}: Props) {
    return (
        <>
            <Head title="Create" />
            <div className="px-4 py-7 text-foreground">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <CreatePost
                        connectedAccounts={connectedAccounts}
                        systems={systems}
                    />
                    <aside className="flex flex-col gap-6">
                        <RecentlyPublished items={recentlyPublishedItems} />
                    </aside>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Post',
            href: create(),
        },
    ],
};
