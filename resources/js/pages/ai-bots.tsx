import { Head } from '@inertiajs/react';
import CreateBot from '@/components/create-bot';
import { bots } from '@/routes';
import type { System, UserToken } from '@/types';

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
                <CreateBot
                    connectedAccounts={connectedAccounts}
                    systems={systems}
                />
            </div>
        </>
    );
}

AiBots.layout = {
    breadcrumbs: [
        {
            title: 'Bots',
            href: bots(),
        },
    ],
};
