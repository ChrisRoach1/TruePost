import { Head } from '@inertiajs/react';
import CreatePost from '@/components/create-post';
import RecentlyPublished from '@/components/dashboard/recently-published';
import UpNext from '@/components/dashboard/up-next';
import { dashboard } from '@/routes';
import type { System, UserToken } from '@/types';
import type { RecentlyPublishedItem, UpNextItem } from '@/types/userPosts';

type Props = {
    connectedAccounts?: UserToken[];
    systems?: System[];
    upNextItems: UpNextItem[];
    recentlyPublishedItems: RecentlyPublishedItem[];
};

export default function Dashboard({
    connectedAccounts = [],
    systems = [],
    upNextItems = [],
    recentlyPublishedItems = [],
}: Props) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="px-4 py-7 text-foreground">
                <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <CreatePost
                        connectedAccounts={connectedAccounts}
                        systems={systems}
                    />
                    <aside className="flex flex-col gap-6">
                        <UpNext items={upNextItems} />
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
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
