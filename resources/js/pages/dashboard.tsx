import { Head } from '@inertiajs/react';
import CreatePost from '@/components/create-post';
import RecentlyPublished from '@/components/dashboard/recently-published';
import { dashboard } from '@/routes';
import type { System, UserToken } from '@/types';
import type { RecentlyPublishedItem } from '@/types/userPosts';

type Props = {
    connectedAccounts?: UserToken[];
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
            <Head title="Dashboard" />
            <div className="px-4 py-7 text-foreground">
                <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="w-full max-w-4xl">
                        <CreatePost
                            connectedAccounts={connectedAccounts}
                            systems={systems}
                        />
                    </div>
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
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
