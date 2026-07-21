import { router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { Clock, FileText, Sparkles, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { ChannelCard } from '@/components/post-form/channel-card';
import { ChannelTabs } from '@/components/post-form/channel-tabs';
import { CounterRing } from '@/components/post-form/counter-ring';
import { TagInput } from '@/components/post-form/tag-input';
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

export default function CreatePost({
    connectedAccounts = [],
    systems = [],
}: Props) {
    const connectedSystems = connectedAccounts.filter((s) =>
        systems.some((ca) => ca.id === s.system_id),
    );

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | number>('all');

    const { data, setData, processing, submit, reset, errors, clearErrors } =
        useForm<{
            content: string | null;
            userTokenIds: number[];
            customizing: boolean;
            channelContent: Record<number, string>;
            collaborators: Record<number, string[]>;
            tags: Record<number, string[]>;
            is_scheduled: boolean;
            is_draft: boolean;
            scheduled_date?: Date;
            scheduled_date_string?: string;
            scheduled_time?: string;
            image: File | null;
            aiCustomize: boolean;
        }>({
            content: '',
            userTokenIds: [],
            customizing: false,
            channelContent: {},
            collaborators: {},
            tags: {},
            is_scheduled: false,
            is_draft: false,
            scheduled_date: new Date(),
            scheduled_date_string: format(new Date(), 'yyyy-MM-dd'),
            scheduled_time: format(new Date(), 'HH:mm'),
            image: null,
            aiCustomize: false
        });

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;

        clearErrors('image');
        setData('image', file);
    }

    function clearImage() {
        setData('image', null);
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

    function customizePerChannel(checked: boolean) {
        if (!checked) {
            setData((prev) => ({
                ...prev,
                channelContent: {},
                customizing: false,
            }));
            setActiveTab('all');

            return;
        }

        setData("aiCustomize", false);

        const sortedConnectedSystems = connectedSystems
            .filter((account) => data.userTokenIds.includes(account.id))
            .sort((a, b) => a.system.order - b.system.order);

        const firstId = sortedConnectedSystems[0]?.id;
        const seed = data.content ?? '';

        setData((prev) => ({
            ...prev,
            customizing: true,
            content: null,
            channelContent:
                firstId !== undefined ? { [firstId]: seed } : {},
        }));

        if (firstId !== undefined) {
            setActiveTab(firstId);
        }
    }

    function toggleAiCustomizePerChannel(checked: boolean) {
        setData("aiCustomize", checked);

        if (checked && data.customizing) {
            setData((prev) => ({
                ...prev,
                channelContent: {},
                customizing: false,
            }));
            setActiveTab('all');
        }
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
                scheduled_time: undefined,
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
        router.flushAll();
    }

    const effectiveTab: 'all' | number =
        activeTab === 'all' || data.userTokenIds.includes(activeTab)
            ? activeTab
            : 'all';

    function getContent(tab: 'all' | number): string | null {
        if (!data.customizing || tab === 'all') {
            return data.content;
        }

        return data.channelContent[tab] ?? data.content;
    }

    function setContent(tab: 'all' | number, value: string | null) {
        if (tab === 'all' || !data.customizing) {
            setData('content', value);
        } else {
            setData('channelContent', {
                ...data.channelContent,
                [tab]: value ?? '',
            });
        }
    }

    function setCollaborators(tokenId: number, next: string[]) {
        setData('collaborators', { ...data.collaborators, [tokenId]: next });
    }

    function setTags(tokenId: number, next: string[]) {
        setData('tags', { ...data.tags, [tokenId]: next });
    }

    function getChipCount(id: number): number {
        if (data.customizing) {
            const override = data.channelContent[id];

            if (override !== undefined) {
                return override.length;
            }
        }

        return data.content?.length ?? 0;
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
    const showTagsSection = selectedSystems.some(
        (s) => s.system.can_collaborate || s.system.can_tag,
    );
    const step = (n: number) => String(n).padStart(2, '0');
    const mediaStep = showTagsSection ? 4 : 3;

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

                if (connectedSystem && data.content) {
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
            (data.content && data.content.trim().length > 0 ||
                (data.customizing &&
                    Object.keys(data.channelContent).length ===
                        data.userTokenIds.length &&
                    Object.values(data.channelContent).every(
                        (content) => content.trim().length > 0,
                    ))) &&
            data.userTokenIds.length > 0 &&
            !isOverLimit &&
            !isMissingRequiredImage &&
            ((!data.is_draft &&
                Boolean(data.scheduled_date) &&
                Boolean(data.scheduled_time)) ||
                data.is_draft)
        );
    }

    const activeAccount =
        effectiveTab === 'all'
            ? null
            : connectedSystems.find((a) => a.id === effectiveTab);

    const counterLimit =
        activeAccount?.system.max_post_length ??
        (selectedSystems.length > 0
            ? Math.min(...selectedSystems.map((s) => s.system.max_post_length))
            : 0);
    const counterCount = currentText?.length ?? 0;
    const counterPct = counterLimit > 0 ? counterCount / counterLimit : 0;
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
        <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
            <div className="border-b border-border px-7 pt-6 pb-5">
                <p
                    className={cn(
                        'text-[11px] font-semibold tracking-widest uppercase transition-colors',
                        data.is_draft ? 'text-amber-600' : 'text-primary',
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
                    number={step(1)}
                    title="Where"
                    description="pick the channels this dispatch goes out to"
                />

                {connectedSystems.length > 0 ? (
                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                        {connectedSystems
                            .sort((a, b) => a.system.order - b.system.order)
                            .map((account) => (
                                <ChannelCard
                                    key={account.id}
                                    account={account}
                                    selected={data.userTokenIds.includes(
                                        account.id,
                                    )}
                                    count={getChipCount(account.id)}
                                    onToggle={() => togglePlatform(account.id)}
                                />
                            ))}
                    </div>
                ) : (
                    <div className="mt-4 rounded-lg border border-dashed border-border/70 p-3.5 text-center text-[13px] text-muted-foreground">
                        No accounts connected. Connect an account to start
                        posting.
                    </div>
                )}
            </div>

            <div className="border-t border-border px-7 pt-5 pb-5">
                <SectionHeader
                    number={step(2)}
                    title="Compose"
                    description={
                        data.aiCustomize
                            ? 'write once — AI adapts each channel'
                            : data.customizing
                              ? 'tune each channel yourself'
                              : 'one message, every channel'
                    }
                    action={
                        data.userTokenIds.length > 1 && (
                            <div className="flex flex-col items-end gap-2">
                                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-foreground">
                                    <Switch
                                        size="sm"
                                        checked={data.customizing}
                                        onCheckedChange={customizePerChannel}
                                    />
                                    Customize manually
                                </label>
                                <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-foreground">
                                    <Switch
                                        size="sm"
                                        checked={data.aiCustomize}
                                        onCheckedChange={
                                            toggleAiCustomizePerChannel
                                        }
                                    />
                                    <span className="inline-flex items-center gap-1">
                                        <Sparkles className="size-3 text-primary" />
                                        Let AI adapt each channel
                                    </span>
                                </label>
                            </div>
                        )
                    }
                />

                {data.customizing && data.userTokenIds.length > 0 && (
                    <ChannelTabs
                        accounts={connectedSystems.filter((account) =>
                            data.userTokenIds.includes(account.id),
                        )}
                        activeTab={effectiveTab}
                        onSelect={(id) => setActiveTab(id)}
                        getCount={getChipCount}
                        isModified={isModified}
                    />
                )}

                <Textarea
                    value={currentText ?? ''}
                    onChange={(e) => setContent(effectiveTab, e.target.value)}
                    placeholder={
                        data.aiCustomize
                            ? 'Write your core message — AI will tailor it per channel…'
                            : 'What do you want to say?'
                    }
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
                        <CounterRing pct={counterPct} over={counterOver} />
                    </div>
                )}
            </div>

            {showTagsSection && (
                <div className="border-t border-border px-7 pt-5 pb-5">
                    <SectionHeader
                        number={step(3)}
                        title="Tags & Collaborators"
                        description="add collaborators and tags per channel"
                    />

                    <div className="mt-4 space-y-4">
                        {selectedSystems
                            .filter(
                                (account) =>
                                    account.system.can_collaborate ||
                                    account.system.can_tag,
                            )
                            .sort((a, b) => a.system.order - b.system.order)
                            .map((account) => (
                                <div
                                    key={account.id}
                                    className="rounded-lg border border-border/70 p-3.5"
                                >
                                    <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                                        <span
                                            className="grid size-4 place-items-center"
                                            style={{
                                                color: account.system
                                                    .background_color,
                                            }}
                                        >
                                            <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                            >
                                                <path d={account.system.icon} />
                                            </svg>
                                        </span>
                                        {account.system.name}
                                    </div>

                                    <div className="mt-3 space-y-3">
                                        {account.system.can_collaborate && (
                                            <TagInput
                                                label="Collaborators"
                                                placeholder="Add a collaborator"
                                                values={
                                                    data.collaborators[
                                                        account.id
                                                    ] ?? []
                                                }
                                                onChange={(next) =>
                                                    setCollaborators(
                                                        account.id,
                                                        next,
                                                    )
                                                }
                                            />
                                        )}
                                        {account.system.can_tag && (
                                            <TagInput
                                                label="Tags"
                                                placeholder="Add a tag"
                                                values={
                                                    data.tags[account.id] ?? []
                                                }
                                                onChange={(next) =>
                                                    setTags(account.id, next)
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            <div className="border-t border-border px-7 pt-5 pb-5">
                <SectionHeader
                    number={step(mediaStep)}
                    title="Media"
                    description="attach an image or video"
                    action={
                        requiresImage && (
                            <span className="text-[11px] font-semibold tracking-widest text-amber-600 uppercase">
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
                    accept="image/jpeg,video/mp4,video/quicktime,.jpg,.jpeg,.mp4,.mov"
                    className="hidden"
                    onChange={handleImageChange}
                />
                {data.image ? (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3.5 py-2.5 text-sm">
                        <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                            <FileText className="size-4 shrink-0" />
                            <span className="truncate">{data.image.name}</span>
                        </div>
                        <button
                            type="button"
                            onClick={clearImage}
                            className="grid size-7 shrink-0 place-items-center rounded-full border-none bg-foreground/70 text-background"
                            aria-label="Remove file"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-amber-500/60 bg-transparent px-6 py-10 text-center transition-colors hover:border-amber-500 hover:bg-amber-500/[0.03]"
                    >
                        <span className="text-lg text-muted-foreground">
                            Add media
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
                                jpg, mp4, mov
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
                        onClick={scheduleOpen ? clearSchedule : openSchedule}
                        className={cn(
                            'border-zinc-50/20 bg-transparent text-zinc-50 hover:bg-zinc-50/10 hover:text-zinc-50 disabled:opacity-40',
                            scheduleOpen && 'border-zinc-50/40 bg-zinc-50/10',
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
                                            data.scheduled_date ?? '',
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
                                            new Date(data.scheduled_date ?? '')
                                        }
                                        onSelect={(e) => {
                                            const next = e ?? new Date();
                                            setData('scheduled_date', next);
                                            setData(
                                                'scheduled_date_string',
                                                format(next, 'yyyy-MM-dd'),
                                            );
                                        }}
                                        disabled={(date) =>
                                            date <
                                            new Date(
                                                new Date().setHours(0, 0, 0, 0),
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
                                    setData('scheduled_time', e.target.value)
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
    );
}
