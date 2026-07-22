import { Head } from '@inertiajs/react';
import CreatePost from '@/components/create-post';
import RecentlyPublished from '@/components/dashboard/recently-published';
import { bots, create } from '@/routes';
import type { System, UserToken } from '@/types';
import type { RecentlyPublishedItem } from '@/types/userPosts';

type Props = {
    connectedAccounts?: UserToken[];
    systems?: System[];
};

export default function AiBots({
    connectedAccounts = [],
    systems = []
}: Props) {
    return (
        <>
            <Head title="AI Bots" />
            <div className="px-4 py-7 text-foreground">

            </div>
        </>
    );
}

AiBots.layout = {
    breadcrumbs: [
        {
            title: 'AI Bots',
            href: bots(),
        },
    ],
};
