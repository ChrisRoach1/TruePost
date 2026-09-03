import { Head, router, usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import AccountsAvailablePlatforms from '@/components/accounts/available-platforms';
import AccountsPlatformSection from '@/components/accounts/platform-section';
import { accounts } from '@/routes';
import { deleteMethod } from '@/routes/accounts';
import oauth from '@/routes/oauth';
import type { ConnectedAccount, System } from '@/types';

type Props = {
    connectedAccounts?: ConnectedAccount[];
    systems: System[];
};

export default function Accounts({ connectedAccounts = [], systems }: Props) {
    const { auth } = usePage().props;

    const accountLimit = auth.is_pro_member
        ? auth.pro_account_limit
        : auth.solo_account_limit;
    const atAccountLimit = connectedAccounts.length >= accountLimit;

    const accountsBySystem = useMemo(() => {
        const map = new Map<number, ConnectedAccount[]>();

        for (const account of connectedAccounts) {
            const list = map.get(account.system_id) ?? [];
            list.push(account);
            map.set(account.system_id, list);
        }

        return map;
    }, [connectedAccounts]);

    const orderedSystems = useMemo(
        () => [...systems].sort((a, b) => a.order - b.order),
        [systems],
    );

    const connectedSystems = useMemo(
        () =>
            orderedSystems.filter(
                (system) => (accountsBySystem.get(system.id)?.length ?? 0) > 0,
            ),
        [orderedSystems, accountsBySystem],
    );

    const availableSystems = useMemo(
        () =>
            orderedSystems.filter(
                (system) =>
                    (accountsBySystem.get(system.id)?.length ?? 0) === 0,
            ),
        [orderedSystems, accountsBySystem],
    );

    function connectPlatform(platform: System) {
        window.location.href = oauth.redirect(platform.url_slug).url;
    }

    function disconnect(account: ConnectedAccount) {
        router.delete(deleteMethod(account.id));
        router.flushAll();
    }

    return (
        <>
            <Head title="Connected Accounts" />
            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="mx-auto w-full max-w-6xl space-y-8">
                    <header className="flex flex-col gap-4 pt-2 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                            <span className="font-mono text-[11px] font-semibold tracking-widest text-primary uppercase">
                                Configuration · Accounts
                            </span>
                            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                                The{' '}
                                <span className="font-sans text-primary">
                                    roster
                                </span>
                            </h1>
                        </div>

                        <div className="flex flex-col gap-1 md:items-end">
                            <span className="font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                                {auth.is_pro_member ? 'Pro plan' : 'Solo plan'}
                            </span>
                            <span className="font-mono text-[12px] text-foreground">
                                {Math.min(
                                    connectedAccounts.length,
                                    accountLimit,
                                )}{' '}
                                of {accountLimit} accounts connected
                            </span>
                        </div>
                    </header>

                    {connectedSystems.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="space-y-10">
                            {connectedSystems.map((platform, i) => (
                                <AccountsPlatformSection
                                    key={platform.id}
                                    platform={platform}
                                    accounts={
                                        accountsBySystem.get(platform.id) ?? []
                                    }
                                    index={i}
                                    canAddAccount={!atAccountLimit}
                                    onConnect={connectPlatform}
                                    onDisconnect={disconnect}
                                />
                            ))}
                        </div>
                    )}

                    {atAccountLimit ? (
                        <AccountLimitNotice
                            limit={accountLimit}
                            isPro={auth.is_pro_member}
                        />
                    ) : (
                        <AccountsAvailablePlatforms
                            systems={availableSystems}
                            onConnect={connectPlatform}
                        />
                    )}

                    <footer className="flex items-start gap-3 border-t border-dashed border-border pt-4">
                        <span className="font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                            Fine print
                        </span>
                        <p className="max-w-2xl text-[12px] leading-relaxed text-muted-foreground">
                            TruePost never stores your password. We use OAuth
                            scoped to the permissions you grant — and we ask for
                            the minimum each platform allows. Revoke access
                            anytime from this page or from the platform itself.
                        </p>
                    </footer>
                </div>
            </div>
        </>
    );
}

function AccountLimitNotice({
    limit,
    isPro,
}: {
    limit: number;
    isPro: boolean;
}) {
    return (
        <section className="space-y-3 pt-2">
            <header className="flex items-baseline gap-2">
                <span className="text-[18px] font-semibold tracking-tight text-foreground">
                    The roster is
                </span>
                <span className="font-sans text-[18px] text-primary">full</span>
            </header>

            <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <span className="font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                        {isPro ? 'Pro plan' : 'Solo plan'} · {limit} of {limit}{' '}
                        accounts
                    </span>
                    <p className="max-w-lg text-[12px] leading-relaxed text-muted-foreground">
                        {isPro
                            ? "You've connected every account your plan allows. Disconnect one above to make room."
                            : "You've connected every account your plan allows. Upgrade to Pro for more accounts, or disconnect one above to make room."}
                    </p>
                </div>
            </div>
        </section>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
            <span className="font-sans text-[20px] text-foreground">
                The roster is empty
            </span>
            <p className="max-w-sm text-[12px] text-muted-foreground">
                Connect your first account below to start dispatching on its
                behalf.
            </p>
        </div>
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
