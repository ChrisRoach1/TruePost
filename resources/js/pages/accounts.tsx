import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AccountsAvailablePlatforms from '@/components/accounts/available-platforms';
import PageSelectDialog from '@/components/accounts/page-select-dialog';
import AccountsPlatformSection from '@/components/accounts/platform-section';
import { getTokenStatus } from '@/components/accounts/token-status';
import { accounts } from '@/routes';
import { deleteMethod } from '@/routes/accounts';
import oauth, { refreshToken } from '@/routes/oauth';
import type { System, UserToken } from '@/types';

type Props = {
    connectedAccounts?: UserToken[];
    systems: System[];
};

export default function Accounts({ connectedAccounts = [], systems }: Props) {
    const { pagesToSelect } = usePage().props;
    const [pageSelectDismissed, setPageSelectDismissed] = useState(false);

    const accountsBySystem = useMemo(() => {
        const map = new Map<number, UserToken[]>();

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

    const stats = useMemo(() => {
        let healthy = 0;
        let expiring = 0;

        for (const account of connectedAccounts) {
            const status = getTokenStatus(account);

            if (status === 'healthy') {
                healthy += 1;
            } else {
                expiring += 1;
            }
        }

        return {
            connected: connectedAccounts.length,
            healthy,
            expiring,
        };
    }, [connectedAccounts]);

    function connectPlatform(platform: System) {
        window.location.href = oauth.redirect(platform.url_slug).url;
    }

    function disconnect(account: UserToken) {
        router.delete(deleteMethod(account.id));
    }

    function refresh(account: UserToken) {
        router.post(refreshToken(account.id));
    }

    return (
        <>
            <Head title="Connected Accounts" />
            {pagesToSelect != null && (
                <PageSelectDialog
                    pages={pagesToSelect}
                    open={!pageSelectDismissed}
                    onOpenChange={(open) => setPageSelectDismissed(!open)}
                />
            )}
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
                            <p className="max-w-xl text-[13px] text-muted-foreground">
                                Every account TruePost can dispatch on your
                                behalf — with the keys, scopes, and quiet
                                renewals that keep them working.
                            </p>
                        </div>

                        <StatsCard
                            connected={stats.connected}
                            healthy={stats.healthy}
                            expiring={stats.expiring}
                        />
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
                                    onConnect={connectPlatform}
                                    onDisconnect={disconnect}
                                    onRefresh={refresh}
                                />
                            ))}
                        </div>
                    )}

                    <AccountsAvailablePlatforms
                        systems={availableSystems}
                        onConnect={connectPlatform}
                    />

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

function StatsCard({
    connected,
    healthy,
    expiring,
}: {
    connected: number;
    healthy: number;
    expiring: number;
}) {
    return (
        <div className="flex shrink-0 items-stretch divide-x divide-border rounded-xl border border-border bg-card shadow-sm">
            <Stat value={connected} label="Connected" tone="default" />
            <Stat value={healthy} label="Healthy" tone="healthy" />
            <Stat value={expiring} label="Expiring" tone="expiring" />
        </div>
    );
}

function Stat({
    value,
    label,
    tone,
}: {
    value: number;
    label: string;
    tone: 'default' | 'healthy' | 'expiring';
}) {
    const valueColor =
        tone === 'expiring'
            ? 'text-amber-600 dark:text-amber-400'
            : tone === 'healthy'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-foreground';

    return (
        <div className="flex min-w-[88px] flex-col items-center justify-center gap-1 px-4 py-3">
            <span
                className={`text-2xl font-semibold tabular-nums ${valueColor}`}
            >
                {value}
            </span>
            <span className="font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                {label}
            </span>
        </div>
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
