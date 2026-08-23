import { router, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import Heading from '@/components/heading';
import { SystemIcon } from '@/components/system-icon';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { systemTileStyle } from '@/lib/system-colors';
import proSubscription from '@/routes/pro-subscription';
import soloSubscription from '@/routes/solo-subscription';
import type { ConnectedAccount } from '@/types';
import type { BotPost } from '@/types/bots';

function accountFeature(limit: number): string {
    return `${limit} connected accounts`;
}

function botFeature(limit: number): string {
    return limit === 1 ? '1 bot' : `${limit} bots`;
}

function toggleId(ids: number[], id: number): number[] {
    return ids.includes(id)
        ? ids.filter((value) => value !== id)
        : [...ids, id];
}

function initialKeepIds(
    ids: number[],
    limit: number,
    overLimit: boolean,
): number[] {
    return overLimit ? ids.slice(0, limit) : [];
}

export default function SubscriptionSettings({
    connectedAccounts = [],
    bots = [],
}: {
    connectedAccounts?: ConnectedAccount[];
    bots?: BotPost[];
}) {
    const { auth } = usePage().props;
    const overAccounts = connectedAccounts.length > auth.solo_account_limit;
    const overBots = bots.length > auth.solo_bot_limit;

    const checkoutSolo = () => {
        window.location.href = soloSubscription.checkout().url;
    };

    const checkoutPro = () => {
        window.location.href = proSubscription.checkout().url;
    };

    const downgradeToSolo = (
        keepAccountIds: number[],
        keepBotIds: number[],
        visit?: { onFinish?: () => void },
    ) => {
        router.post(
            soloSubscription.downgrade().url,
            {
                ...(overAccounts ? { keep_account_ids: keepAccountIds } : {}),
                ...(overBots ? { keep_bot_ids: keepBotIds } : {}),
            },
            {
                onFinish: visit?.onFinish,
            },
        );
    };

    const soloFeatures = [
        accountFeature(auth.solo_account_limit),
        botFeature(auth.solo_bot_limit),
        'Multiple accounts per channel',
        'Unlimited posts',
        'Support',
    ];

    const proFeatures = [
        accountFeature(auth.pro_account_limit),
        botFeature(auth.pro_bot_limit),
        'Multiple accounts per channel',
        'Per-channel AI rewrites',
        'Unlimited posts',
        'Scheduled posts',
        'Support',
    ];

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title="Subscription"
                description="Manage your plan and billing"
            />

            {auth.is_pro_member ? (
                <div className="space-y-4">
                    <ProPlanCard features={proFeatures} isCurrent />
                    <SoloPlanCard
                        features={soloFeatures}
                        accounts={connectedAccounts}
                        bots={bots}
                        accountLimit={auth.solo_account_limit}
                        botLimit={auth.solo_bot_limit}
                        onDowngrade={downgradeToSolo}
                    />
                </div>
            ) : auth.is_solo_member ? (
                <div className="space-y-4">
                    <SoloPlanCard features={soloFeatures} isCurrent />
                    <ProPlanCard
                        features={proFeatures}
                        onUpgrade={checkoutPro}
                    />
                </div>
            ) : (
                <SoloPlanCard
                    features={soloFeatures}
                    onSubscribe={checkoutSolo}
                />
            )}

            <p className="text-[11px] text-muted-foreground">
                TruePost requires an active Solo or Pro plan. To stop billing
                entirely, delete your account below.
            </p>
        </div>
    );
}

function SoloPlanCard({
    features,
    accounts = [],
    bots = [],
    accountLimit = 0,
    botLimit = 0,
    isCurrent = false,
    onSubscribe,
    onDowngrade,
}: {
    features: string[];
    accounts?: ConnectedAccount[];
    bots?: BotPost[];
    accountLimit?: number;
    botLimit?: number;
    isCurrent?: boolean;
    onSubscribe?: () => void;
    onDowngrade?: (
        keepAccountIds: number[],
        keepBotIds: number[],
        visit?: { onFinish?: () => void },
    ) => void;
}) {
    return (
        <div
            className={
                isCurrent
                    ? 'space-y-5 rounded-xl border border-primary/30 bg-primary/5 p-5'
                    : 'space-y-5 rounded-xl border border-dashed border-border bg-card/50 p-5'
            }
        >
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <span
                        className={
                            isCurrent
                                ? 'font-mono text-[10px] font-semibold tracking-widest text-primary uppercase'
                                : 'font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase'
                        }
                    >
                        {isCurrent ? 'Current plan' : 'Solo'}
                    </span>
                    <p className="text-[18px] font-semibold tracking-tight text-foreground">
                        TruePost{' '}
                        <span className="font-sans text-primary">Solo</span>
                    </p>
                </div>
                <div className="flex items-baseline gap-1 text-foreground">
                    <span className="text-[28px] font-bold tracking-tight">
                        $9
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                        / month
                    </span>
                </div>
            </div>

            <FeatureList features={features} />

            {isCurrent ? (
                <div className="border-t border-dashed border-primary/20 pt-4">
                    <span className="text-[11px] text-muted-foreground">
                        Thanks for supporting TruePost.
                    </span>
                </div>
            ) : onDowngrade ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <DowngradeToSoloDialog
                        accounts={accounts}
                        bots={bots}
                        accountLimit={accountLimit}
                        botLimit={botLimit}
                        onConfirm={onDowngrade}
                    />
                    <span className="text-[11px] text-muted-foreground">
                        Pro is cancelled immediately.
                    </span>
                </div>
            ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                        type="button"
                        onClick={onSubscribe}
                        data-test="subscribe-solo-button"
                    >
                        Start Solo
                    </Button>
                    <span className="text-[11px] text-muted-foreground">
                        7-day free trial.
                    </span>
                </div>
            )}
        </div>
    );
}

function ProPlanCard({
    features,
    isCurrent = false,
    onUpgrade,
}: {
    features: string[];
    isCurrent?: boolean;
    onUpgrade?: () => void;
}) {
    return (
        <div
            className={
                isCurrent
                    ? 'space-y-5 rounded-xl border border-primary/30 bg-primary/5 p-5'
                    : 'space-y-5 rounded-xl border border-dashed border-border bg-card/50 p-5'
            }
        >
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <span
                        className={
                            isCurrent
                                ? 'font-mono text-[10px] font-semibold tracking-widest text-primary uppercase'
                                : 'font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase'
                        }
                    >
                        {isCurrent ? 'Current plan' : 'Pro'}
                    </span>
                    <p className="flex items-center gap-2 text-[18px] font-semibold tracking-tight text-foreground">
                        TruePost{' '}
                        <span className="font-sans text-primary">Pro</span>
                    </p>
                </div>
                <div className="flex items-baseline gap-1 text-foreground">
                    <span className="text-[28px] font-bold tracking-tight">
                        $25
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                        / month
                    </span>
                </div>
            </div>

            <FeatureList features={features} />

            {isCurrent ? (
                <div className="border-t border-dashed border-primary/20 pt-4">
                    <span className="text-[11px] text-muted-foreground">
                        Thanks for supporting TruePost.
                    </span>
                </div>
            ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                        type="button"
                        onClick={onUpgrade}
                        data-test="upgrade-to-pro-button"
                    >
                        Upgrade to Pro
                    </Button>
                    <span className="text-[11px] text-muted-foreground">
                        Solo is cancelled as soon as Pro starts.
                    </span>
                </div>
            )}
        </div>
    );
}

function FeatureList({ features }: { features: string[] }) {
    return (
        <ul className="grid gap-2 sm:grid-cols-2">
            {features.map((feature) => (
                <li
                    key={feature}
                    className="flex items-start gap-2 text-[12.5px] leading-snug text-muted-foreground"
                >
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    {feature}
                </li>
            ))}
        </ul>
    );
}

function DowngradeToSoloDialog({
    accounts,
    bots,
    accountLimit,
    botLimit,
    onConfirm,
}: {
    accounts: ConnectedAccount[];
    bots: BotPost[];
    accountLimit: number;
    botLimit: number;
    onConfirm: (
        keepAccountIds: number[],
        keepBotIds: number[],
        visit?: { onFinish?: () => void },
    ) => void;
}) {
    const overAccounts = accounts.length > accountLimit;
    const overBots = bots.length > botLimit;
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [keepAccountIds, setKeepAccountIds] = useState<number[]>([]);
    const [keepBotIds, setKeepBotIds] = useState<number[]>([]);

    const resetKeepLists = () => {
        setKeepAccountIds(
            initialKeepIds(
                accounts.map((account) => account.id),
                accountLimit,
                overAccounts,
            ),
        );
        setKeepBotIds(
            initialKeepIds(
                bots.map((bot) => bot.id),
                botLimit,
                overBots,
            ),
        );
        setProcessing(false);
    };

    const overAccountSelection = keepAccountIds.length > accountLimit;
    const overBotSelection = keepBotIds.length > botLimit;
    const canConfirm =
        !processing && !overAccountSelection && !overBotSelection;

    const description =
        overAccounts || overBots
            ? [
                  'Pro will be cancelled immediately.',
                  overAccounts
                      ? `Unselected accounts will be disconnected (keep up to ${accountLimit}).`
                      : null,
                  overBots
                      ? `Unselected bots will be deleted (keep up to ${botLimit}).`
                      : null,
                  "You won't be able to schedule new posts. Already-scheduled posts will still go out. AI rewrites will stop, and you'll be billed for Solo instead.",
              ]
                  .filter(Boolean)
                  .join(' ')
            : "Pro will be cancelled immediately. You'll be billed for Solo instead. You won't be able to schedule new posts (already-scheduled posts still go out), and AI rewrites will stop.";

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);

                if (nextOpen) {
                    resetKeepLists();
                }
            }}
        >
            <DialogTrigger asChild>
                <Button variant="outline" data-test="downgrade-to-solo-button">
                    Switch to Solo
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogTitle>Switch back to Solo?</DialogTitle>
                <DialogDescription>{description}</DialogDescription>

                {overAccounts && (
                    <KeepList
                        title="Accounts to keep"
                        selected={keepAccountIds.length}
                        limit={accountLimit}
                    >
                        {accounts.map((account) => {
                            const checked = keepAccountIds.includes(account.id);
                            const atLimit =
                                !checked &&
                                keepAccountIds.length >= accountLimit;

                            return (
                                <KeepRow
                                    key={account.id}
                                    id={`keep-account-${account.id}`}
                                    checked={checked}
                                    disabled={atLimit}
                                    testId={`keep-account-${account.id}`}
                                    onToggle={() =>
                                        setKeepAccountIds((ids) =>
                                            toggleId(ids, account.id),
                                        )
                                    }
                                >
                                    <AccountKeepLabel account={account} />
                                </KeepRow>
                            );
                        })}
                    </KeepList>
                )}

                {overBots && (
                    <KeepList
                        title="Bots to keep"
                        selected={keepBotIds.length}
                        limit={botLimit}
                    >
                        {bots.map((bot) => {
                            const checked = keepBotIds.includes(bot.id);
                            const atLimit =
                                !checked && keepBotIds.length >= botLimit;

                            return (
                                <KeepRow
                                    key={bot.id}
                                    id={`keep-bot-${bot.id}`}
                                    checked={checked}
                                    disabled={atLimit}
                                    testId={`keep-bot-${bot.id}`}
                                    onToggle={() =>
                                        setKeepBotIds((ids) =>
                                            toggleId(ids, bot.id),
                                        )
                                    }
                                >
                                    <BotKeepLabel bot={bot} />
                                </KeepRow>
                            );
                        })}
                    </KeepList>
                )}

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Keep Pro</Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        data-test="confirm-downgrade-to-solo-button"
                        disabled={!canConfirm}
                        onClick={() => {
                            setProcessing(true);
                            onConfirm(keepAccountIds, keepBotIds, {
                                onFinish: () => setProcessing(false),
                            });
                        }}
                    >
                        Switch to Solo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function KeepList({
    title,
    selected,
    limit,
    children,
}: {
    title: string;
    selected: number;
    limit: number;
    children: ReactNode;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    {title}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                    {selected} of {limit}
                </span>
            </div>
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
                {children}
            </ul>
        </div>
    );
}

function KeepRow({
    id,
    checked,
    disabled,
    testId,
    onToggle,
    children,
}: {
    id: string;
    checked: boolean;
    disabled: boolean;
    testId: string;
    onToggle: () => void;
    children: ReactNode;
}) {
    return (
        <li>
            <Label
                htmlFor={id}
                className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-[12.5px] leading-snug font-normal hover:bg-accent/40"
            >
                <Checkbox
                    id={id}
                    checked={checked}
                    disabled={disabled}
                    data-test={testId}
                    onCheckedChange={() => {
                        if (!disabled) {
                            onToggle();
                        }
                    }}
                    className="mt-0.5"
                />
                <span className="min-w-0 flex-1">{children}</span>
            </Label>
        </li>
    );
}

function AccountKeepLabel({ account }: { account: ConnectedAccount }) {
    const handle =
        account.username?.trim() || account.display_name || 'Account';

    return (
        <span className="flex min-w-0 items-center gap-2">
            {account.system && (
                <span
                    {...systemTileStyle(
                        account.system,
                        'grid size-5 shrink-0 place-items-center rounded',
                    )}
                >
                    <SystemIcon icon={account.system.icon} size={11} />
                </span>
            )}
            <span className="min-w-0 truncate text-foreground">
                {handle}
                {account.system ? (
                    <span className="text-muted-foreground">
                        {' '}
                        · {account.system.name}
                    </span>
                ) : null}
            </span>
        </span>
    );
}

function BotKeepLabel({ bot }: { bot: BotPost }) {
    const description = bot.bot_description?.trim() || 'Untitled bot';
    const systems = (bot.bot_post_systems ?? [])
        .map((channel) => channel.connected_account?.system?.name)
        .filter(Boolean);

    return (
        <span className="flex min-w-0 flex-col gap-0.5">
            <span className="line-clamp-2 text-foreground">{description}</span>
            <span className="truncate text-[11px] text-muted-foreground">
                {systems.length > 0 ? systems.join(' · ') : 'No channels'}
            </span>
        </span>
    );
}
