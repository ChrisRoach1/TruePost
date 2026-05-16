import { useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { Clock, FileText, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { store } from '@/routes/userPost';
import type { System, UserToken } from '@/types';

type Props = {
    connectedAccounts?: UserToken[];
    systems?: System[];
};

type CardProps = {
    account: UserToken;
    selected: boolean;
    count: number;
    onToggle: () => void;
};

function ChannelCard({ account, selected, count, onToggle }: CardProps) {
    const limit = account.system.max_post_length;
    const over = count > limit;
    const left = Math.max(0, limit - count);

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
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d={account.system.icon} />
                </svg>
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
            <span className="flex shrink-0 flex-col items-end leading-none">
                <span
                    className={cn(
                        'text-xl font-semibold tabular-nums',
                        over ? 'text-destructive' : 'text-foreground',
                    )}
                >
                    {over
                        ? `−${(count - limit).toLocaleString()}`
                        : left.toLocaleString()}
                </span>
                <span className="mt-1 text-[9px] font-semibold tracking-[0.18em] text-muted-foreground">
                    LEFT
                </span>
            </span>
            <span className="absolute top-2 right-2 size-2 rounded-full bg-emerald-500 ring-2 ring-card" />
        </button>
    );
}

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
                <span className="font-mono font-semibold text-emerald-600">
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

function CounterRing({ pct, over }: { pct: number; over: boolean }) {
    const r = 7;
    const c = 2 * Math.PI * r;
    const safePct = Math.max(0, Math.min(1, pct));
    const dash = c * safePct;

    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            className={cn(
                '-rotate-90',
                over ? 'text-destructive' : 'text-foreground',
            )}
        >
            <circle
                cx="9"
                cy="9"
                r={r}
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.18"
                strokeWidth="1.5"
            />
            <circle
                cx="9"
                cy="9"
                r={r}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${c - dash}`}
            />
        </svg>
    );
}

export default function CreatePost({
    connectedAccounts = [],
    systems = [],
}: Props) {
    const connectedSystems = connectedAccounts.filter((s) =>
        systems.some((ca) => ca.id === s.system_id),
    );

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | number>('all');

    const { data, setData, processing, submit, reset, errors, clearErrors } =
        useForm<{
            content: string;
            userTokenIds: number[];
            customizing: boolean;
            channelContent: Record<number, string>;
            is_scheduled: boolean;
            is_draft: boolean;
            scheduled_date?: Date;
            scheduled_date_string?: string;
            scheduled_time?: string;
            timezone: string;
            image: File | null;
        }>({
            content: '',
            userTokenIds: [],
            customizing: false,
            channelContent: {},
            is_scheduled: false,
            is_draft: false,
            scheduled_date: new Date(),
            scheduled_date_string: format(new Date(), 'yyyy-MM-dd'),
            scheduled_time: format(new Date(), 'HH:mm'),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            image: null,
        });

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;

        clearErrors('image');
        setData('image', file);
        setImagePreview((prev) => {
            if (prev) {
                URL.revokeObjectURL(prev);
            }

            return file ? URL.createObjectURL(file) : null;
        });
    }

    function clearImage() {
        setData('image', null);
        setImagePreview((prev) => {
            if (prev) {
                URL.revokeObjectURL(prev);
            }

            return null;
        });
        clearErrors('image');

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    function togglePlatform(userTokenId: number) {
        setData(
            'userTokenIds',
            data.userTokenIds.includes(userTokenId)
                ? data.userTokenIds.filter((id) => id !== userTokenId)
                : [...data.userTokenIds, userTokenId],
        );
    }

    function openSchedule() {
        setScheduleOpen(true);
        setData((prev) => ({
            ...prev,
            is_scheduled: true,
            is_draft: false,
        }));
    }

    function clearSchedule() {
        const now = new Date();
        setScheduleOpen(false);
        setData((prev) => ({
            ...prev,
            is_scheduled: false,
            scheduled_date: now,
            scheduled_date_string: format(now, 'yyyy-MM-dd'),
            scheduled_time: format(now, 'HH:mm'),
        }));
    }

    function toggleDraft() {
        if (!data.is_draft) {
            setScheduleOpen(false);
            setData((prev) => ({
                ...prev,
                is_draft: true,
                is_scheduled: false,
                scheduled_date: undefined,
                scheduled_date_string: undefined,
                scheduled_time: undefined
            }));
        } else {
            const now = new Date();
            setData((prev) => ({
                ...prev,
                is_draft: false,
                is_scheduled: false,
                scheduled_date: now,
                scheduled_date_string: format(now, 'yyyy-MM-dd'),
                scheduled_time: format(now, 'HH:mm'),
            }));
        }
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        submit(store());
        reset();
        clearImage();
        setScheduleOpen(false);
        setActiveTab('all');
    }

    const effectiveTab: 'all' | number =
        activeTab === 'all' || data.userTokenIds.includes(activeTab)
            ? activeTab
            : 'all';

    function getContent(tab: 'all' | number): string {
        if (!data.customizing || tab === 'all') {
            return data.content;
        }

        return data.channelContent[tab] ?? data.content;
    }

    function setContent(tab: 'all' | number, value: string) {
        if (tab === 'all' || !data.customizing) {
            setData('content', value);
        } else {
            setData('channelContent', {
                ...data.channelContent,
                [tab]: value,
            });
        }
    }

    function getChipCount(id: number): number {
        if (data.customizing) {
            const override = data.channelContent[id];

            if (override !== undefined) {
                return override.length;
            }
        }

        return data.content.length;
    }

    function isModified(id: number): boolean {
        const override = data.channelContent[id];

        return override !== undefined && override !== data.content;
    }

    const currentText = getContent(effectiveTab);
    const selectedSystems = connectedSystems.filter((s) =>
        data.userTokenIds.includes(s.id),
    );
    const requiringSystems = selectedSystems.filter(
        (s) => s.system.image_required,
    );
    const requiresImage = requiringSystems.length > 0;
    const isMissingRequiredImage = requiresImage && !data.image;

    function canSubmit(): boolean {
        let isOverLimit = false;

        if (data.customizing) {
            for (const [key, value] of Object.entries(data.channelContent)) {
                const connectedSystem = connectedSystems.find(
                    (a) => a.id === Number.parseInt(key),
                );

                if (connectedSystem) {
                    if (
                        value.trim().length >
                        connectedSystem?.system.max_post_length
                    ) {
                        isOverLimit = true;
                    }
                }
            }
        } else {
            for (const systemId of data.userTokenIds) {
                const connectedSystem = connectedSystems.find(
                    (a) => a.id === systemId,
                );

                if (connectedSystem) {
                    if (
                        data.content.trim().length >
                        connectedSystem.system.max_post_length
                    ) {
                        isOverLimit = true;
                    }
                }
            }
        }

        return (
            (data.content.trim().length > 0 ||
                (data.customizing &&
                    Object.keys(data.channelContent).length ===
                        data.userTokenIds.length &&
                    Object.values(data.channelContent).every(
                        (content) => content.trim().length > 0,
                    ))) &&
            data.userTokenIds.length > 0 &&
            !isOverLimit &&
            !isMissingRequiredImage &&
            (!data.is_draft && Boolean(data.scheduled_date) && Boolean(data.scheduled_time) || data.is_draft)

        );
    }

    const activeAccount =
        effectiveTab === 'all'
            ? null
            : connectedSystems.find((a) => a.id === effectiveTab);

    const counterLimit =
        activeAccount?.system.max_post_length ??
        (selectedSystems.length > 0
            ? Math.min(
                  ...selectedSystems.map((s) => s.system.max_post_length),
              )
            : 0);
    const counterCount = currentText.length;
    const counterPct =
        counterLimit > 0 ? counterCount / counterLimit : 0;
    const counterOver = counterLimit > 0 && counterCount > counterLimit;

    const scheduleLabel = data.is_scheduled ? `Post now` : 'Schedule for later';
    const draftLabel = data.is_draft ? 'Cancel draft' : 'Save as draft';
    const submitLabel = data.is_draft
        ? 'Save draft'
        : data.is_scheduled
          ? 'Schedule'
          : 'Post now';
    const headerStatus = data.is_draft
        ? 'New dispatch · Saving as draft'
        : data.is_scheduled
          ? 'New dispatch · Scheduled · Just now'
          : 'New dispatch · Draft · Just now';

    return (
        <div className="mx-auto max-w-3xl">
        <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
            <div className="border-b border-border px-7 pt-6 pb-5">
                <p
                    className={cn(
                        'text-[11px] font-semibold tracking-[0.18em] uppercase transition-colors',
                        data.is_draft
                            ? 'text-amber-600'
                            : 'text-emerald-600',
                    )}
                >
                    {headerStatus}
                </p>
                <h2 className="mt-2.5 text-2xl font-semibold tracking-tight text-foreground">
                    Compose once, land everywhere.
                </h2>
            </div>

            <div className="px-7 pt-5 pb-5">
                <SectionHeader
                    number="01"
                    title="Where"
                    description="pick the channels this dispatch goes out to"
                />

                {connectedSystems.length > 0 ? (
                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                        {connectedSystems
                            .sort(
                                (a, b) =>
                                    a.system.order - b.system.order,
                            )
                            .map((account) => (
                                <ChannelCard
                                    key={account.id}
                                    account={account}
                                    selected={data.userTokenIds.includes(
                                        account.id,
                                    )}
                                    count={getChipCount(account.id)}
                                    onToggle={() =>
                                        togglePlatform(account.id)
                                    }
                                />
                            ))}
                    </div>
                ) : (
                    <div className="mt-4 rounded-lg border border-dashed border-border/70 p-3.5 text-center text-[13px] text-muted-foreground">
                        No accounts connected. Connect an account
                        to start posting.
                    </div>
                )}
            </div>

            <div className="border-t border-border px-7 pt-5 pb-5">
                <SectionHeader
                    number="02"
                    title="Compose"
                    description="one message, every channel"
                    action={
                        data.userTokenIds.length > 1 && (
                            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-foreground">
                                <Switch
                                    size="sm"
                                    checked={data.customizing}
                                    onCheckedChange={(checked) => {
                                        if (!checked) {
                                            setData(
                                                'channelContent',
                                                {},
                                            );
                                            setActiveTab('all');
                                        } else {
                                            const sortedConnectedSystems =
                                                connectedSystems
                                                    .filter(
                                                        (account) =>
                                                            data.userTokenIds.includes(
                                                                account.id,
                                                            ),
                                                    )
                                                    .sort(
                                                        (a, b) =>
                                                            a.system
                                                                .order -
                                                            b.system
                                                                .order,
                                                    );

                                            setActiveTab(
                                                sortedConnectedSystems[0]
                                                    .id,
                                            );
                                            setContent(
                                                effectiveTab,
                                                data.content,
                                            );
                                        }

                                        setData(
                                            'customizing',
                                            checked,
                                        );
                                    }}
                                />
                                Customize per channel
                            </label>
                        )
                    }
                />

                {data.customizing &&
                    data.userTokenIds.length > 0 && (
                        <div className="mt-3 flex gap-0.5 overflow-x-auto border-b border-border">
                            {connectedSystems
                                .filter((account) =>
                                    data.userTokenIds.includes(
                                        account.id,
                                    ),
                                )
                                .sort(
                                    (a, b) =>
                                        a.system.order -
                                        b.system.order,
                                )
                                .map((account) => {
                                    const tabActive =
                                        effectiveTab === account.id;
                                    const tabCount = getChipCount(
                                        account.id,
                                    );
                                    const tabOver =
                                        tabCount >
                                        account.system
                                            .max_post_length;

                                    return (
                                        <button
                                            key={account.id}
                                            type="button"
                                            onClick={() =>
                                                setActiveTab(
                                                    account.id,
                                                )
                                            }
                                            className={cn(
                                                'relative flex items-center gap-2 border-b-2 px-3 py-2 text-[13px] transition-colors',
                                                tabActive
                                                    ? 'border-foreground font-semibold text-foreground'
                                                    : 'border-transparent font-medium text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            <span
                                                className="grid size-4 place-items-center"
                                                style={{
                                                    color: tabActive
                                                        ? account
                                                              .system
                                                              .background_color
                                                        : undefined,
                                                }}
                                            >
                                                <span
                                                    className={cn(
                                                        'grid place-items-center',
                                                        !tabActive &&
                                                            'text-muted-foreground/60',
                                                    )}
                                                >
                                                    <svg
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            d={
                                                                account
                                                                    .system
                                                                    .icon
                                                            }
                                                        />
                                                    </svg>
                                                </span>
                                            </span>
                                            {account.system.name}
                                            {isModified(
                                                account.id,
                                            ) && (
                                                <span className="size-1.5 rounded-full bg-primary" />
                                            )}
                                            {tabOver && (
                                                <span className="text-[11px] font-bold text-destructive">
                                                    !
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                        </div>
                    )}

                <Textarea
                    value={currentText}
                    onChange={(e) =>
                        setContent(effectiveTab, e.target.value)
                    }
                    placeholder="What do you want to say?"
                    className="mt-4 min-h-40 resize-y border-none bg-transparent px-0 py-1 text-[15px] leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
                />

                {counterLimit > 0 && (
                    <div className="mt-1 flex items-center justify-end gap-2 border-t border-dashed border-border pt-2">
                        <span
                            className={cn(
                                'text-xs tabular-nums',
                                counterOver
                                    ? 'text-destructive'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {counterCount} / {counterLimit}
                        </span>
                        <CounterRing
                            pct={counterPct}
                            over={counterOver}
                        />
                    </div>
                )}
            </div>

            <div className="border-t border-border px-7 pt-5 pb-5">
                <SectionHeader
                    number="03"
                    title="Media"
                    description="drop images"
                    action={
                        requiresImage && (
                            <span className="text-[11px] font-semibold tracking-[0.18em] text-amber-600 uppercase">
                                Required by{' '}
                                {requiringSystems
                                    .map((s) => s.system.name)
                                    .join(', ')}
                            </span>
                        )
                    }
                />

                <input
                    ref={fileInputRef}
                    id="post-image"
                    type="file"
                    accept="image/jpeg"
                    className="hidden"
                    onChange={handleImageChange}
                />
                {imagePreview ? (
                    <div className="relative mt-4 w-fit">
                        <img
                            src={imagePreview}
                            alt="Selected"
                            className="block max-h-64 rounded-lg border border-border object-contain"
                        />
                        <button
                            type="button"
                            onClick={clearImage}
                            className="absolute top-2 right-2 grid size-7 place-items-center rounded-full border-none bg-foreground/70 text-background"
                            aria-label="Remove image"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() =>
                            fileInputRef.current?.click()
                        }
                        className="mt-4 flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-amber-500/60 bg-transparent px-6 py-10 text-center transition-colors hover:border-amber-500 hover:bg-amber-500/[0.03]"
                    >
                        <span className="text-lg text-muted-foreground">
                            Add an image
                        </span>
                        <span className="text-[12px] text-muted-foreground">
                            drop here, or{' '}
                            <span className="underline underline-offset-2">
                                click to browse
                            </span>
                            <span className="mx-1.5 text-muted-foreground/50">
                                ·
                            </span>
                            <span className="text-muted-foreground/70">
                                jpg
                            </span>
                        </span>
                    </button>
                )}
                {errors.image && (
                    <p className="mt-1.5 text-xs text-destructive">
                        {errors.image}
                    </p>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-zinc-900 px-6 py-3.5 text-zinc-50 dark:bg-zinc-950">
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={data.is_draft}
                        onClick={
                            scheduleOpen
                                ? clearSchedule
                                : openSchedule
                        }
                        className={cn(
                            'border-zinc-50/20 bg-transparent text-zinc-50 hover:bg-zinc-50/10 hover:text-zinc-50 disabled:opacity-40',
                            scheduleOpen &&
                                'border-zinc-50/40 bg-zinc-50/10',
                        )}
                    >
                        <Clock className="size-3.5" />
                        {scheduleLabel}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleDraft}
                        className={cn(
                            'border-zinc-50/20 bg-transparent text-zinc-50 hover:bg-zinc-50/10 hover:text-zinc-50',
                            data.is_draft &&
                                'border-amber-400/60 bg-amber-400/10 text-amber-200 hover:bg-amber-400/15 hover:text-amber-100',
                        )}
                    >
                        <FileText className="size-3.5" />
                        {draftLabel}
                    </Button>
                    {scheduleOpen && !data.is_draft && (
                        <div className="flex items-center gap-1.5">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="border-zinc-50/20 bg-transparent text-xs text-zinc-50 hover:bg-zinc-50/10 hover:text-zinc-50"
                                    >
                                        {format(
                                            data.scheduled_date ?? "",
                                            'MMM d, yyyy',
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                >
                                    <Calendar
                                        mode="single"
                                        selected={
                                            new Date(
                                                data.scheduled_date ?? "",
                                            )
                                        }
                                        onSelect={(e) => {
                                            const next =
                                                e ?? new Date();
                                            setData(
                                                'scheduled_date',
                                                next,
                                            );
                                            setData(
                                                'scheduled_date_string',
                                                format(
                                                    next,
                                                    'yyyy-MM-dd',
                                                ),
                                            );
                                        }}
                                        disabled={(date) =>
                                            date <
                                            new Date(
                                                new Date().setHours(
                                                    0,
                                                    0,
                                                    0,
                                                    0,
                                                ),
                                            )
                                        }
                                    />
                                </PopoverContent>
                            </Popover>
                            <Input
                                type="time"
                                step="60"
                                value={data.scheduled_time}
                                onChange={(e) =>
                                    setData(
                                        'scheduled_time',
                                        e.target.value,
                                    )
                                }
                                className="h-8 w-28 appearance-none border-zinc-50/20 bg-transparent text-xs text-zinc-50 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none [&::-webkit-calendar-picker-indicator]:invert"
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        type="submit"
                        disabled={!canSubmit() || processing}
                        className={cn(
                            'text-zinc-50',
                            data.is_draft
                                ? 'bg-amber-600 hover:bg-amber-500'
                                : 'bg-emerald-700 hover:bg-emerald-600',
                        )}
                    >
                        {processing
                            ? data.is_draft
                                ? 'Saving...'
                                : 'Posting...'
                            : submitLabel}
                        {data.userTokenIds.length > 0 && (
                            <span className="grid size-[18px] place-items-center rounded-full bg-zinc-50/20 text-[11px] font-bold text-zinc-50">
                                {data.userTokenIds.length}
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </form>
    </div>
    );
}

