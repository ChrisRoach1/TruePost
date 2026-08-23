import { useForm } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';
import { useEffect } from 'react';
import { SystemIcon } from '@/components/system-icon';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { systemTileStyle } from '@/lib/system-colors';
import { cn } from '@/lib/utils';
import { update } from '@/routes/bot';
import type { System, ConnectedAccount } from '@/types';
import type { BotPost } from '@/types/bots';

const MAX_TIMES_PER_DAY = 5;

type Props = {
    bot: BotPost;
    connectedAccounts: ConnectedAccount[];
    systems: System[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function AccountCard({
    account,
    selected,
    onToggle,
}: {
    account: ConnectedAccount;
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
                {...systemTileStyle(
                    account.system,
                    'grid size-10 shrink-0 place-items-center rounded-md',
                )}
            >
                <SystemIcon icon={account.system.icon} size={20} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-[13px] font-semibold text-foreground">
                    {account.system.name}
                </span>
                {account.username && (
                    <span className="truncate text-[11px] text-muted-foreground">
                        @{account.username}
                    </span>
                )}
            </span>
            <span className="absolute top-2 right-2 size-2 rounded-full bg-emerald-500 ring-2 ring-card" />
        </button>
    );
}

export default function EditBot({
    bot,
    connectedAccounts,
    systems,
    open,
    onOpenChange,
}: Props) {
    const eligibleAccounts = connectedAccounts.filter((account) =>
        systems.some((system) => system.id === account.system_id),
    );

    const { data, setData, processing, patch, errors, reset } = useForm<{
        connectedAccountIds: number[];
        description: string;
        times: string[];
    }>({
        connectedAccountIds: (bot.bot_post_systems ?? []).map(
            (channel) => channel.connected_account_id,
        ),
        description: bot.bot_description ?? '',
        times: bot.post_times ?? ['09:00'],
    });

    useEffect(() => {
        if (!open) {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    function togglePlatform(connectedAccountId: number) {
        setData(
            'connectedAccountIds',
            data.connectedAccountIds.includes(connectedAccountId)
                ? data.connectedAccountIds.filter((id) => id !== connectedAccountId)
                : [...data.connectedAccountIds, connectedAccountId],
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
            data.connectedAccountIds.length > 0 &&
            data.description.trim().length > 0 &&
            data.times.length > 0 &&
            data.times.length <= MAX_TIMES_PER_DAY &&
            data.times.every((time) => time.length > 0) &&
            !hasDuplicateTimes
        );
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        patch(update(bot.id).url, {
            onSuccess: () => {
                onOpenChange(false);
            },
        });
    }

    const postsPerDayLabel =
        data.times.length === 1
            ? 'Posts once a day'
            : `Posts ${data.times.length} times a day`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit bot</DialogTitle>
                    <DialogDescription>
                        Change where it posts, what it posts about, and how
                        often.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-5 pt-2"
                >
                    <section className="space-y-2">
                        <div className="text-sm font-medium text-foreground">
                            Channels
                        </div>
                        {eligibleAccounts.length > 0 ? (
                            <div className="grid gap-2.5 sm:grid-cols-2">
                                {eligibleAccounts
                                    .slice()
                                    .sort(
                                        (a, b) =>
                                            a.system.order - b.system.order,
                                    )
                                    .map((account) => (
                                        <AccountCard
                                            key={account.id}
                                            account={account}
                                            selected={data.connectedAccountIds.includes(
                                                account.id,
                                            )}
                                            onToggle={() =>
                                                togglePlatform(account.id)
                                            }
                                        />
                                    ))}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed border-border/70 p-3.5 text-center text-[13px] text-muted-foreground">
                                No eligible accounts connected.
                            </div>
                        )}
                        {errors.connectedAccountIds && (
                            <p className="text-xs text-destructive">
                                {errors.connectedAccountIds}
                            </p>
                        )}
                    </section>

                    <section className="space-y-2">
                        <div className="text-sm font-medium text-foreground">
                            Topic
                        </div>
                        <Textarea
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            placeholder="What should this bot post about?"
                            className="min-h-32 resize-y text-[15px] leading-relaxed"
                        />
                        {errors.description && (
                            <p className="text-xs text-destructive">
                                {errors.description}
                            </p>
                        )}
                    </section>

                    <section className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-foreground">
                                Schedule
                            </div>
                            <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                                {postsPerDayLabel}
                            </span>
                        </div>

                        <div className="space-y-2.5">
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

                        <div className="flex items-center gap-3 pt-1">
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
                            <p className="text-xs text-destructive">
                                {errors.times}
                            </p>
                        )}
                    </section>

                    <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={!canSubmit() || processing}
                        >
                            {processing ? 'Saving...' : 'Save bot'}
                            {data.connectedAccountIds.length > 0 && (
                                <span className="grid size-[18px] place-items-center rounded-full bg-foreground/15 text-[11px] font-semibold">
                                    {data.connectedAccountIds.length}
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
