import { Head } from '@inertiajs/react';
import CreatePost from '@/components/create-post';
import { dashboard } from '@/routes';
import type { System, UserToken } from '@/types';

type Props = {
    connectedAccounts?: UserToken[];
    systems?: System[];
};

export default function Dashboard({
    connectedAccounts = [],
    systems = [],
}: Props) {

    return (
        <>
            <Head title="Dashboard" />
            <div className="px-4 py-7 text-foreground">
                <CreatePost connectedAccounts={connectedAccounts} systems={systems}  />
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
