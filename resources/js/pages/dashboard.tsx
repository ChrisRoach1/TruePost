import { Head, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { Clock, ImagePlus, X } from 'lucide-react';
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
import { dashboard } from '@/routes';
import { store } from '@/routes/userPost';
import type { System, UserToken } from '@/types';

type Props = {
    connectedAccounts?: UserToken[];
    systems?: System[];
};

const MAX_CHARACTERS = 280;

type ChipProps = {
    account: UserToken;
    selected: boolean;
    count: number;
    onToggle: () => void;
};

function ChannelChip({ account, selected, count, onToggle }: ChipProps) {
    const limit = MAX_CHARACTERS;
    const over = count > limit;
    const near = !over && count > limit * 0.85;
    const ringColorClass = over
        ? 'text-destructive'
        : near
          ? 'text-amber-500'
          : 'text-primary';
    const ringBgClass = over
        ? 'bg-destructive'
        : near
          ? 'bg-amber-500'
          : 'bg-primary';
    const pct = Math.min(1, count / limit);

    return (
        <button
            type="button"
            onClick={onToggle}
            className={cn(
                'relative flex items-center gap-2.5 rounded-full border py-2 pr-3.5 pl-2.5 transition-all',
                selected
                    ? 'border-foreground bg-card opacity-100 shadow-xs'
                    : 'border-border bg-transparent opacity-60 hover:opacity-80',
            )}
        >
            <span
                className="grid size-[22px] shrink-0 place-items-center"
                style={{
                    color: selected
                        ? account.system.background_color
                        : undefined,
                }}
            >
                <span
                    className={cn(
                        'grid place-items-center',
                        !selected && 'text-muted-foreground/60',
                    )}
                >
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d={account.system.icon} />
                    </svg>
                </span>
            </span>
            <span
                className={cn(
                    'text-[13px] font-medium',
                    selected ? 'text-foreground' : 'text-muted-foreground',
                )}
            >
                {account.system.name}
            </span>
            {selected && (
                <span
                    className={cn(
                        'ml-0.5 text-[11px] font-semibold tabular-nums',
                        ringColorClass,
                    )}
                >
                    {over ? `−${count - limit}` : limit - count}
                </span>
            )}
            {selected && (
                <span className="pointer-events-none absolute right-2 bottom-0.5 left-2 h-0.5 overflow-hidden rounded-sm">
                    <span
                        className={cn(
                            'block h-full transition-[width] duration-200',
                            ringBgClass,
                        )}
                        style={{ width: `${pct * 100}%` }}
                    />
                </span>
            )}
        </button>
    );
}

export default function Dashboard({
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
            scheduled_date: Date;
            scheduled_date_string: string;
            scheduled_time: string;
            timezone: string;
            image: File | null;
        }>({
            content: '',
            userTokenIds: [],
            customizing: false,
            channelContent: {},
            is_scheduled: false,
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

        if (!data.is_scheduled) {
            setData('is_scheduled', true);
        }
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
    const characterCount = currentText.length;
    const isOverLimit = characterCount > MAX_CHARACTERS;
    const counterPct = Math.min(1, characterCount / MAX_CHARACTERS);
    const requiresImage = connectedSystems.some(
        (system) =>
            data.userTokenIds.includes(system.id) &&
            system.system.image_required,
    );
    const isMissingRequiredImage = requiresImage && !data.image;

    const canSubmit =
        (data.content.trim().length > 0 ||
        (data.customizing && Object.keys(data.channelContent).length === data.userTokenIds.length && Object.values(data.channelContent).every(content => content.trim().length > 0))) &&
        data.userTokenIds.length > 0 &&
        !isOverLimit &&
        !isMissingRequiredImage &&
        data.scheduled_date &&
        data.scheduled_time;

    const activeAccount =
        effectiveTab === 'all'
            ? null
            : connectedSystems.find((a) => a.id === effectiveTab);

    const scheduleLabel = data.is_scheduled
        ? `Post now`
        : 'Schedule for later';

    return (
        <>
            <Head title="Dashboard" />
            <div className="min-h-full px-4 py-7 text-foreground">
                <div className="mx-auto max-w-3xl">
                    <form
                        onSubmit={handleSubmit}
                        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                    >
                        <div className="border-b border-border px-6 pt-5 pb-4">
                            <h2 className="mb-4 text-base font-semibold tracking-tight">
                                Create post
                            </h2>

                            {connectedSystems.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {connectedSystems.map((account) => (
                                        <ChannelChip
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
                                <div className="rounded-lg border border-dashed border-border/70 p-3.5 text-center text-[13px] text-muted-foreground">
                                    No accounts connected. Connect an account
                                    to start posting.
                                </div>
                            )}
                        </div>

                        {data.userTokenIds.length > 0 && (
                            <div className="flex items-center gap-2.5 border-b border-border bg-muted/40 px-6 py-2.5">
                                <span className="text-xs font-medium text-muted-foreground">
                                    Compose
                                </span>
                                <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs font-semibold">
                                    <Switch
                                        size="sm"
                                        checked={data.customizing}
                                        onCheckedChange={(checked) => {
                                            if(!checked){
                                                setData('channelContent', {});
                                                setActiveTab('all');
                                            }else{
                                                setActiveTab(data.userTokenIds[0]);
                                            }

                                            setData('customizing', checked);
                                        }}
                                    />
                                    Customize per channel
                                </label>
                            </div>
                        )}

                        {data.customizing && data.userTokenIds.length > 0 && (
                            <div className="flex gap-0.5 overflow-x-auto border-b border-border px-3.5">
                                {connectedSystems
                                    .filter((account) =>
                                        data.userTokenIds.includes(account.id),
                                    )
                                    .map((account) => {
                                        const tabActive =
                                            effectiveTab === account.id;
                                        const tabCount = getChipCount(
                                            account.id,
                                        );
                                        const tabOver =
                                            tabCount > MAX_CHARACTERS;

                                        return (
                                            <button
                                                key={account.id}
                                                type="button"
                                                onClick={() =>
                                                    setActiveTab(account.id)
                                                }
                                                className={cn(
                                                    'relative flex items-center gap-2 border-b-2 px-3 py-2 text-[13px] transition-colors',
                                                    tabActive
                                                        ? 'border-foreground bg-muted/40 font-semibold text-foreground'
                                                        : 'border-transparent font-medium text-muted-foreground hover:text-foreground',
                                                )}
                                            >
                                                <span
                                                    className="grid size-4 place-items-center"
                                                    style={{
                                                        color: tabActive
                                                            ? account.system
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
                                                {isModified(account.id) && (
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

                        <div className="flex flex-col gap-3 px-6 py-4">
                            <Textarea
                                value={currentText}
                                onChange={(e) =>
                                    setContent(effectiveTab, e.target.value)
                                }
                                placeholder={
                                    effectiveTab === 'all'
                                        ? 'What do you want to say?'
                                        : `${activeAccount?.system.name ?? ''} version… (leave matching to use the same as 'All')`
                                }
                                className="min-h-36 resize-y border-none bg-transparent px-0 py-1 text-[15px] leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
                            />

                            <div className="flex items-center gap-1.5 border-t border-border pt-2">
                                <div className="ml-auto flex items-center gap-2.5">
                                    <div
                                        className={cn(
                                            'text-xs tabular-nums',
                                            isOverLimit
                                                ? 'font-semibold text-destructive'
                                                : 'font-medium text-muted-foreground',
                                        )}
                                    >
                                        {characterCount} / {MAX_CHARACTERS}
                                    </div>
                                    <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 22 22"
                                    >
                                        <circle
                                            cx="11"
                                            cy="11"
                                            r="9"
                                            fill="none"
                                            className="stroke-border"
                                            strokeWidth="2"
                                        />
                                        <circle
                                            cx="11"
                                            cy="11"
                                            r="9"
                                            fill="none"
                                            className={cn(
                                                isOverLimit
                                                    ? 'stroke-destructive'
                                                    : 'stroke-primary',
                                            )}
                                            strokeWidth="2"
                                            strokeDasharray={`${counterPct * 56.55} 56.55`}
                                            transform="rotate(-90 11 11)"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 pb-4">
                            <input
                                ref={fileInputRef}
                                id="post-image"
                                type="file"
                                accept="image/jpeg"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                            {imagePreview ? (
                                <div className="relative w-fit">
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
                                    className="flex w-full items-center justify-center gap-2.5 rounded-lg border-[1.5px] border-dashed border-border/70 bg-transparent p-3.5 text-[13px] text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                                >
                                    <ImagePlus size={16} />
                                    Drop a JPEG image — or click to browse
                                </button>
                            )}
                            {errors.image && (
                                <p className="mt-1.5 text-xs text-destructive">
                                    {errors.image}
                                </p>
                            )}
                            {isMissingRequiredImage && !errors.image && (
                                <p className="mt-1.5 text-xs text-destructive">
                                    An image is required for one or more of
                                    the selected platforms.
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/40 px-6 py-3.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={
                                        scheduleOpen
                                            ? clearSchedule
                                            : openSchedule
                                    }
                                    className={cn(
                                        !scheduleOpen &&
                                            !data.is_scheduled &&
                                            'border-transparent bg-transparent shadow-none hover:bg-muted',
                                    )}
                                >
                                    <Clock className="size-3.5" />
                                    {scheduleLabel}
                                </Button>
                                {scheduleOpen && (
                                    <div className="flex items-center gap-1.5">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs"
                                                >
                                                    {format(
                                                        data.scheduled_date,
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
                                                            data.scheduled_date,
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
                                            className="h-8 w-28 appearance-none text-xs [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="submit"
                                    disabled={!canSubmit || processing}
                                    className="bg-foreground text-background hover:bg-foreground/90"
                                >
                                    {processing
                                        ? 'Posting...'
                                        : data.is_scheduled
                                          ? 'Schedule'
                                          : 'Post now'}
                                    {data.userTokenIds.length > 0 && (
                                        <span className="grid size-[18px] place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                                            {data.userTokenIds.length}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
