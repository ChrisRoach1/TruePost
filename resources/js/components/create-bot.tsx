import { useForm } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';
import { SystemIcon } from '@/components/system-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { System, UserToken } from '@/types';
import { bots } from '@/routes';
import { store } from '@/routes/bots';

const MAX_TIMES_PER_DAY = 5;

type Props = {
    connectedAccounts?: UserToken[];
    systems?: System[];
};

function SectionHeader({
    number,
    title,
    description,
    action,
}: {
    number: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-border pb-2">
            <div className="flex items-baseline gap-2 text-[13px]">
                <span className="font-mono font-semibold text-primary">
                    {number}
                </span>
                <span className="font-semibold text-foreground">{title}</span>
                {description && (
                    <span className="text-muted-foreground">
                        — {description}
                    </span>
                )}
            </div>
            {action && <div className="flex items-center">{action}</div>}
        </div>
    );
}

function AccountCard({
    account,
    selected,
    onToggle,
}: {
    account: UserToken;
    selected: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={cn(
                'group relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                selected
                    ? 'border-foreground bg-card shadow-xs'
                    : 'border-border bg-card opacity-55 hover:opacity-90',
            )}
        >
            <span
                className="grid size-10 shrink-0 place-items-center rounded-md text-white"
                style={{ backgroundColor: account.system.background_color }}
            >
                <SystemIcon icon={account.system.icon} size={20} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-[13px] font-semibold text-foreground">
                    {account.system.name}
                </span>
                {account.user_name && (
                    <span className="truncate text-[11px] text-muted-foreground">
                        @{account.user_name}
                    </span>
                )}
            </span>
            <span className="absolute top-2 right-2 size-2 rounded-full bg-emerald-500 ring-2 ring-card" />
        </button>
    );
}

export default function CreateBot({
    connectedAccounts = [],
    systems = [],
}: Props) {
    const eligibleAccounts = connectedAccounts.filter(
        (account) =>
            systems.some((system) => system.id === account.system_id)
    );

    const { data, setData, processing, errors, submit } = useForm<{
        userTokenIds: number[];
        description: string;
        times: string[];
    }>({
        userTokenIds: [],
        description: '',
        times: ['09:00'],
    });

    function togglePlatform(userTokenId: number) {
        setData(
            'userTokenIds',
            data.userTokenIds.includes(userTokenId)
                ? data.userTokenIds.filter((id) => id !== userTokenId)
                : [...data.userTokenIds, userTokenId],
        );
    }

    function addTime() {
        if (data.times.length >= MAX_TIMES_PER_DAY) {
            return;
        }

        setData('times', [...data.times, '12:00']);
    }

    function removeTime(index: number) {
        setData(
            'times',
            data.times.filter((_, i) => i !== index),
        );
    }

    function setTime(index: number, value: string) {
        setData(
            'times',
            data.times.map((time, i) => (i === index ? value : time)),
        );
    }

    function canSubmit(): boolean {
        const hasDuplicateTimes =
            new Set(data.times).size !== data.times.length;

        return (
            data.userTokenIds.length > 0 &&
            data.description.trim().length > 0 &&
            data.times.length > 0 &&
            data.times.length <= MAX_TIMES_PER_DAY &&
            data.times.every((time) => time.length > 0) &&
            !hasDuplicateTimes
        );
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        submit(store());
    }

    const step = (n: number) => String(n).padStart(2, '0');
    const postsPerDayLabel =
        data.times.length === 1
            ? 'Posts once a day'
            : `Posts ${data.times.length} times a day`;

    return (
        <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
            <div className="border-b border-border px-7 pt-6 pb-5">
                <p className="text-[11px] font-semibold tracking-widest text-primary uppercase">
                    New bot · Posting on autopilot
                </p>
                <h2 className="mt-2.5 text-2xl font-semibold tracking-tight text-foreground">
                    Set it up once, post every day.
                </h2>
            </div>

            <div className="px-7 pt-5 pb-5">
                <SectionHeader
                    number={step(1)}
                    title="Where"
                    description="pick the channels this bot posts to"
                />

                {eligibleAccounts.length > 0 ? (
                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                        {eligibleAccounts
                            .sort((a, b) => a.system.order - b.system.order)
                            .map((account) => (
                                <AccountCard
                                    key={account.id}
                                    account={account}
                                    selected={data.userTokenIds.includes(
                                        account.id,
                                    )}
                                    onToggle={() => togglePlatform(account.id)}
                                />
                            ))}
                    </div>
                ) : (
                    <div className="mt-4 rounded-lg border border-dashed border-border/70 p-3.5 text-center text-[13px] text-muted-foreground">
                        No eligible accounts connected. Bots post text-only, so
                        connect an account that doesn't require media.
                    </div>
                )}
                {errors.userTokenIds && (
                    <p className="mt-1.5 text-xs text-destructive">
                        {errors.userTokenIds}
                    </p>
                )}
            </div>

            <div className="border-t border-border px-7 pt-5 pb-5">
                <SectionHeader
                    number={step(2)}
                    title="What"
                    description="tell the bot what it should post about"
                />

                <Textarea
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="What should this bot post about? e.g. daily productivity tips for remote developers…"
                    className="mt-4 min-h-40 resize-y border-none bg-transparent px-0 py-1 text-[15px] leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
                />
                {errors.description && (
                    <p className="mt-1.5 text-xs text-destructive">
                        {errors.description}
                    </p>
                )}
            </div>

            <div className="border-t border-border px-7 pt-5 pb-5">
                <SectionHeader
                    number={step(3)}
                    title="When"
                    description="how often the bot posts each day"
                    action={
                        <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                            {postsPerDayLabel}
                        </span>
                    }
                />

                <div className="mt-4 space-y-2.5">
                    {data.times.map((time, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2.5"
                        >
                            <span className="w-16 font-mono text-xs font-semibold text-muted-foreground">
                                Time {index + 1}
                            </span>
                            <Input
                                type="time"
                                step="60"
                                value={time}
                                onChange={(e) =>
                                    setTime(index, e.target.value)
                                }
                                className="h-9 w-32 text-sm"
                            />
                            {data.times.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeTime(index)}
                                    className="grid size-7 shrink-0 place-items-center rounded-full border-none bg-foreground/70 text-background"
                                    aria-label={`Remove time ${index + 1}`}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex items-center gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTime}
                        disabled={data.times.length >= MAX_TIMES_PER_DAY}
                    >
                        <Plus className="size-3.5" />
                        Add time
                    </Button>
                    {data.times.length >= MAX_TIMES_PER_DAY && (
                        <span className="text-xs text-muted-foreground">
                            Max {MAX_TIMES_PER_DAY} times per day
                        </span>
                    )}
                </div>
                {errors.times && (
                    <p className="mt-1.5 text-xs text-destructive">
                        {errors.times}
                    </p>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border bg-zinc-900 px-6 py-3.5 text-zinc-50 dark:bg-zinc-950">
                <Button
                    type="submit"
                    disabled={!canSubmit() || processing}
                    className="bg-emerald-700 text-zinc-50 hover:bg-emerald-600"
                >
                    {processing ? 'Creating...' : 'Create bot'}
                    {data.userTokenIds.length > 0 && (
                        <span className="grid size-[18px] place-items-center rounded-full bg-zinc-50/20 text-[11px] font-bold text-zinc-50">
                            {data.userTokenIds.length}
                        </span>
                    )}
                </Button>
            </div>
        </form>
    );
}
