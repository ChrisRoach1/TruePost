import { Head, router } from '@inertiajs/react';
import { useMemo } from 'react';
import { SocialPlatformRow } from '@/components/social-platform-row';
import { accounts } from '@/routes';
import { deleteMethod } from '@/routes/accounts';
import oauth from '@/routes/oauth';
import type { System, UserToken } from '@/types';

type Props = {
    connectedAccounts?: UserToken[];
    systems: System[];
};

export default function Accounts({ connectedAccounts, systems }: Props) {
    const accountsBySystem = useMemo(() => {
        const map = new Map<number, UserToken[]>();

        for (const account of connectedAccounts ?? []) {
            const list = map.get(account.system_id) ?? [];
            list.push(account);
            map.set(account.system_id, list);
        }

        return map;
    }, [connectedAccounts]);

    function connectPlatform(platform: System) {
        window.location.href = oauth.redirect(platform.url_slug).url;
    }

    function disconnect(account: UserToken) {
        router.delete(deleteMethod(account.id));
    }

    return (
        <>
            <Head title="Connected Accounts" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-x-auto rounded-xl p-4">
                {systems.map((platform) => (
                    <SocialPlatformRow
                        key={platform.id}
                        platform={platform}
                        accounts={accountsBySystem.get(platform.id) ?? []}
                        onConnect={connectPlatform}
                        onDisconnect={disconnect}
                    />
                ))}
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
