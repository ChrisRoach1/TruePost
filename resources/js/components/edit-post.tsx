import { useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { Clock, FileText, ImageIcon, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ChannelCard } from '@/components/post-form/channel-card';
import { ChannelTabs } from '@/components/post-form/channel-tabs';
import { CounterRing } from '@/components/post-form/counter-ring';
import { TagInput } from '@/components/post-form/tag-input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { update } from '@/routes/userPost';
import type { System, UserToken } from '@/types';
import type { userPosts } from '@/types/userPosts';

type Props = {
    post: userPosts;
    connectedAccounts: UserToken[];
    systems: System[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

function buildInitialChannelContent(post: userPosts): Record<number, string> {
    const map: Record<number, string> = {};

    for (const system of post.user_post_systems ?? []) {
        if (system.override_content != null) {
            map[system.user_token_id] = system.override_content;
        }
    }

    return map;
}

function buildInitialCollaborators(
    post: userPosts,
): Record<number, string[]> {
    const map: Record<number, string[]> = {};

    for (const system of post.user_post_systems ?? []) {
        if (system.collaborators != null && system.collaborators.length > 0) {
            map[system.user_token_id] = system.collaborators;
        }
    }

    return map;
}

function buildInitialTags(post: userPosts): Record<number, string[]> {
    const map: Record<number, string[]> = {};

    for (const system of post.user_post_systems ?? []) {
        if (system.tags != null && system.tags.length > 0) {
            map[system.user_token_id] = system.tags;
        }
    }

    return map;
}

export default function EditPost({
    post,
    connectedAccounts,
    systems,
    open,
    onOpenChange,
}: Props) {
    const connectedSystems = connectedAccounts.filter((s) =>
        systems.some((ca) => ca.id === s.system_id),
    );

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | number>('all');

    const initialPostAt = post.post_at ? new Date(post.post_at) : new Date();
    const initialChannelContent = buildInitialChannelContent(post);
    const initialCustomizing = Object.keys(initialChannelContent).length > 0;
    const initialCollaborators = buildInitialCollaborators(post);
    const initialTags = buildInitialTags(post);

    const { data, setData, processing, post: postForm, errors, clearErrors, reset } =
        useForm<{
            _method: 'put';
            content: string;
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
            _method: 'put',
            content: post.original_content ?? '',
            userTokenIds: (post.user_post_systems ?? []).map(
                (s) => s.user_token_id,
            ),
            customizing: initialCustomizing,
            channelContent: initialChannelContent,
            collaborators: initialCollaborators,
            tags: initialTags,
            is_scheduled: false,
            is_draft: true,
            scheduled_date: initialPostAt,
            scheduled_date_string: format(initialPostAt, 'yyyy-MM-dd'),
            scheduled_time: format(initialPostAt, 'HH:mm'),
            image: null,
            aiCustomize: false,
        });

    useEffect(() => {
        if (!open) {
            reset();
            clearImage();
            setScheduleOpen(false);
            setActiveTab('all');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

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

        setData('aiCustomize', false);

        const sortedConnectedSystems = connectedSystems
            .filter((account) => data.userTokenIds.includes(account.id))
            .sort((a, b) => a.system.order - b.system.order);

        const firstId = sortedConnectedSystems[0]?.id;
        const seed = data.content;

        setData((prev) => ({
            ...prev,
            customizing: true,
            channelContent: firstId !== undefined ? { [firstId]: seed } : {},
        }));

        if (firstId !== undefined) {
            setActiveTab(firstId);
        }
    }

    function toggleAiCustomizePerChannel(checked: boolean) {
        setData('aiCustomize', checked);

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

        postForm(update(post.id).url, {
            forceFormData: true,
            onSuccess: () => {
                onOpenChange(false);
            },
        });
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
    const hasExistingImage = Boolean(post.media_url);
    const isMissingRequiredImage =
        requiresImage && !data.image && !hasExistingImage;

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
                        connectedSystem.system.max_post_length
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
    const counterCount = currentText.length;
    const counterPct = counterLimit > 0 ? counterCount / counterLimit : 0;
    const counterOver = counterLimit > 0 && counterCount > counterLimit;

    const scheduleLabel = data.is_scheduled ? 'Post now' : 'Schedule for later';
    const draftLabel = data.is_draft ? 'Cancel draft' : 'Keep as draft';
    const submitLabel = data.is_draft
        ? 'Save draft'
        : data.is_scheduled
          ? 'Schedule'
          : 'Post now';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit draft</DialogTitle>
                    <DialogDescription>
                        Update your draft, then schedule or save.
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
                        {connectedSystems.length > 0 ? (
                            <div className="grid gap-2.5 sm:grid-cols-2">
                                {connectedSystems
                                    .slice()
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
                            <div className="rounded-lg border border-dashed border-border/70 p-3.5 text-center text-[13px] text-muted-foreground">
                                No accounts connected.
                            </div>
                        )}
                    </section>

                    <section className="space-y-2">
                        <div className="flex items-start justify-between">
                            <div className="text-sm font-medium text-foreground">
                                Content
                            </div>
                            {data.userTokenIds.length > 1 && (
                                <div className="flex flex-col items-end gap-2">
                                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
                                        <Switch
                                            size="sm"
                                            checked={data.customizing}
                                            onCheckedChange={customizePerChannel}
                                        />
                                        Customize per channel
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
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
                            )}
                        </div>

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
                            value={currentText}
                            onChange={(e) =>
                                setContent(effectiveTab, e.target.value)
                            }
                            placeholder={
                                data.aiCustomize
                                    ? 'Write your core message — AI will tailor it per channel…'
                                    : 'What do you want to say?'
                            }
                            className="min-h-32 resize-y text-[15px] leading-relaxed"
                        />

                        {counterLimit > 0 && (
                            <div className="flex items-center justify-end gap-2">
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
                    </section>

                    {selectedSystems.some(
                        (s) =>
                            s.system.can_collaborate || s.system.can_tag,
                    ) && (
                        <section className="space-y-3">
                            <div className="text-sm font-medium text-foreground">
                                Tags & Collaborators
                            </div>
                            {selectedSystems
                                .filter(
                                    (account) =>
                                        account.system.can_collaborate ||
                                        account.system.can_tag,
                                )
                                .slice()
                                .sort(
                                    (a, b) =>
                                        a.system.order - b.system.order,
                                )
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
                                                    <path
                                                        d={account.system.icon}
                                                    />
                                                </svg>
                                            </span>
                                            {account.system.name}
                                        </div>

                                        <div className="mt-3 space-y-3">
                                            {account.system
                                                .can_collaborate && (
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
                                                        data.tags[
                                                            account.id
                                                        ] ?? []
                                                    }
                                                    onChange={(next) =>
                                                        setTags(
                                                            account.id,
                                                            next,
                                                        )
                                                    }
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </section>
                    )}

                    <section className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-foreground">
                                Media
                            </div>
                            {requiresImage && (
                                <span className="text-[11px] font-medium text-muted-foreground">
                                    Required by{' '}
                                    {requiringSystems
                                        .map((s) => s.system.name)
                                        .join(', ')}
                                </span>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            id="edit-post-image"
                            type="file"
                            accept="image/jpeg,video/mp4,video/quicktime,.jpg,.jpeg,.mp4,.mov"
                            className="hidden"
                            onChange={handleImageChange}
                        />

                        {data.image ? (
                            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm">
                                <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                                    <FileText className="size-4 shrink-0" />
                                    <span className="truncate">
                                        {data.image.name}
                                    </span>
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
                        ) : hasExistingImage ? (
                            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <ImageIcon className="size-4" />
                                    <span>Media attached</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                >
                                    Replace
                                </Button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border-[1.5px] border-dashed border-border bg-transparent px-6 py-6 text-center transition-colors hover:border-foreground/30 hover:bg-muted/30"
                            >
                                <span className="text-sm text-muted-foreground">
                                    Add media
                                </span>
                                <span className="text-[11px] text-muted-foreground/70">
                                    jpg, mp4, mov
                                </span>
                            </button>
                        )}

                        {errors.image && (
                            <p className="text-xs text-destructive">
                                {errors.image}
                            </p>
                        )}
                    </section>

                    <section className="space-y-2">
                        <div className="text-sm font-medium text-foreground">
                            Schedule
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={data.is_draft}
                                onClick={
                                    scheduleOpen ? clearSchedule : openSchedule
                                }
                                className={cn(
                                    scheduleOpen && 'bg-muted',
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
                                    data.is_draft &&
                                        'border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300',
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
                                                    new Date(
                                                        data.scheduled_date ??
                                                            '',
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
                                        className="h-8 w-28"
                                    />
                                </div>
                            )}
                        </div>
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
                            {processing
                                ? data.is_draft
                                    ? 'Saving...'
                                    : 'Posting...'
                                : submitLabel}
                            {data.userTokenIds.length > 0 && (
                                <span className="grid size-[18px] place-items-center rounded-full bg-foreground/15 text-[11px] font-semibold">
                                    {data.userTokenIds.length}
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
