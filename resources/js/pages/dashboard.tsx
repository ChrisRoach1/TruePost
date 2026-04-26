import { Head, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { ImagePlus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import { store } from '@/routes/userPost';
import type { UserToken, System } from '@/types';

type Props = {
    connectedAccounts?: UserToken[];
    systems?: System[];
};

const MAX_CHARACTERS = 280;

export default function Dashboard({
    connectedAccounts = [],
    systems = [],
}: Props) {

    const connectedSystems = connectedAccounts.filter((s) =>
        systems.some((ca) => ca.id === s.system_id),
    );

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const { data, setData, processing, submit, reset, errors, clearErrors } = useForm<{
        content: string;
        userTokenIds: number[];
        is_scheduled: boolean;
        scheduled_date: Date;
        scheduled_date_string: string;
        scheduled_time: string;
        timezone: string;
        image: File | null;
    }>({
        content: '',
        userTokenIds: [],
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

    function toggleSchedule(checked: boolean) {
        const now = new Date();
        setData((prev) => ({
            ...prev,
            is_scheduled: checked,
            scheduled_date: checked ? prev.scheduled_date : now,
            scheduled_date_string: checked
                ? prev.scheduled_date_string
                : format(now, 'yyyy-MM-dd'),
            scheduled_time: checked ? prev.scheduled_time : format(now, 'HH:mm'),
        }));
    }

    function togglePlatform(userTokenId: number) {
        setData(
            'userTokenIds',
            data.userTokenIds.includes(userTokenId)
                ? data.userTokenIds.filter((id) => id !== userTokenId)
                : [...data.userTokenIds, userTokenId],
        );
    }

    function handlSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        submit(store());
        reset();
        clearImage();
    }

    const characterCount = data.content.length;
    const isOverLimit = characterCount > MAX_CHARACTERS;
    const requiresImage = connectedSystems.some(
        (system) =>
            data.userTokenIds.includes(system.id) &&
            system.system.image_required,
    );
    const isMissingRequiredImage = requiresImage && !data.image;
    const canSubmit =
        data.content.trim().length > 0 &&
        data.userTokenIds.length > 0 &&
        !isOverLimit &&
        !isMissingRequiredImage &&
        data.scheduled_date &&
        data.scheduled_time;

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card className="mx-auto w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle>Create Post</CardTitle>
                    </CardHeader>

                    <form onSubmit={handlSubmit}>
                        <CardContent className="space-y-6">
                            {connectedSystems.length > 0 ? (
                                <div className="space-y-3">
                                    <Label>Post to</Label>
                                    <div className="flex flex-wrap gap-3">
                                        {connectedSystems.map((system) => {
                                            const isSelected =
                                                data.userTokenIds.includes(
                                                    system.id,
                                                );

                                            return (
                                                <div
                                                    key={system.id}
                                                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
                                                        isSelected
                                                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                                            : 'border-border hover:border-primary/40 hover:bg-muted/50'
                                                    }`}
                                                >
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() =>
                                                            togglePlatform(
                                                                system.id,
                                                            )
                                                        }
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    />
                                                    <div
                                                        className="flex size-6 shrink-0 items-center justify-center rounded"
                                                        style={{
                                                            backgroundColor: `${system.system.background_color}15`,
                                                        }}
                                                    >
                                                        <svg
                                                            className="size-4"
                                                            viewBox="0 0 24 24"
                                                            fill="currentColor"
                                                            style={{
                                                                color: system.system.icon_color,
                                                            }}
                                                        >
                                                            <path
                                                                d={system.system.icon}
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                                    No accounts connected. Connect an account to
                                    start posting.
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="post-content">Content</Label>
                                <Textarea
                                    id="post-content"
                                    placeholder="What's on your mind?"
                                    className="min-h-32"
                                    value={data.content}
                                    onChange={(e) =>
                                        setData('content', e.target.value)
                                    }
                                />
                                <div className="flex justify-end">
                                    <span
                                        className={`text-xs tabular-nums ${
                                            isOverLimit
                                                ? 'font-medium text-destructive'
                                                : characterCount >
                                                    MAX_CHARACTERS * 0.8
                                                  ? 'text-amber-500'
                                                  : 'text-muted-foreground'
                                        }`}
                                    >
                                        {characterCount} / {MAX_CHARACTERS}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="post-image">Image</Label>
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
                                            className="max-h-64 rounded-lg border object-contain"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="icon"
                                            onClick={clearImage}
                                            className="absolute right-2 top-2 size-7 rounded-full shadow"
                                        >
                                            <X className="size-4" />
                                            <span className="sr-only">
                                                Remove image
                                            </span>
                                        </Button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50"
                                    >
                                        <ImagePlus className="size-4" />
                                        Upload JPEG image
                                    </button>
                                )}
                                {errors.image && (
                                    <p className="text-xs text-destructive">
                                        {errors.image}
                                    </p>
                                )}
                                {isMissingRequiredImage && !errors.image && (
                                    <p className="text-xs text-destructive">
                                        An image is required for one or more
                                        of the selected platforms.
                                    </p>
                                )}
                            </div>

                            <div className="space-y-3 rounded-lg border bg-muted/70 p-4 mb-4">
                                <div className="flex items-center justify-between">
                                    <Label
                                        htmlFor="schedule-toggle"
                                        className="cursor-pointer"
                                    >
                                        Schedule Post
                                    </Label>
                                    <Switch
                                        id="schedule-toggle"
                                        checked={data.is_scheduled}
                                        onCheckedChange={toggleSchedule}
                                    />
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <div className="flex-1 space-y-1.5">
                                        <Label>Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    disabled={!data.is_scheduled}
                                                    className="w-full justify-start text-left font-normal"
                                                >
                                                    {data.scheduled_date
                                                        ? format(
                                                              data.scheduled_date,
                                                              'MMM d, yyyy',
                                                          )
                                                        : 'Pick a date'}
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
                                                    onSelect={(e) =>{
                                                        setData('scheduled_date',e ?? new Date());
                                                        setData('scheduled_date_string', format(e?.toString() ?? "", 'yyyy-MM-dd'))
                                                    }

                                                    }
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
                                    </div>

                                    <div className="w-full space-y-1.5 sm:w-32">
                                        <Label htmlFor="schedule-time">
                                            Time
                                        </Label>
                                        <Input
                                            type="time"
                                            id="time-picker"
                                            step="60"
                                            disabled={!data.is_scheduled}
                                            value={data.scheduled_time}
                                            onChange={(e) =>
                                                setData(
                                                    'scheduled_time',
                                                    e.target.value,
                                                )
                                            }
                                            className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="justify-end border-t pt-4">
                            <Button
                                disabled={!canSubmit || processing}
                            >
                                {processing ? 'Posting...' : 'Post'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
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
