import { Head, router } from '@inertiajs/react';
import { SocialPlatformCard } from '@/components/social-platform-card';
import { accounts } from '@/routes';
import { deleteMethod } from '@/routes/accounts';
import oauth from '@/routes/oauth';
import type { System, UserToken } from '@/types';

type Props = {
    connectedAccounts?: UserToken[];
    systems: System[];
};

export default function Accounts({connectedAccounts, systems}: Props) {
    function connectPlatform(url_slug: string){
        window.location.href = oauth.redirect(url_slug).url;
    }

    function disconnect(system_id: number){
        const connectedAccountId = connectedAccounts?.filter(x => x.system_id === system_id)[0].id;

        if(connectedAccountId){
            router.delete(deleteMethod(connectedAccountId));
        }
    }

    return (
        <>
            <Head title="Connected Accounts" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {systems.map((systems) => (
                        <SocialPlatformCard
                            key={systems.id}
                            platform={systems}
                            isConnected={connectedAccounts?.filter(x => x.system_id === systems.id)?.length ? connectedAccounts?.filter(x => x.system_id === systems.id)?.length > 0 : false}
                            onConnect={(p) => connectPlatform(p.url_slug)}
                            onDisconnect={(p) => disconnect(p.id)}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}

Accounts.layout = {
    breadcrumbs: [
        {
            title: 'Connected Accounts',
            href: accounts(),
        },
    ],
};
