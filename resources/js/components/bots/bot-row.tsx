import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { SystemIcon } from '@/components/system-icon';
import { Button } from '@/components/ui/button';
import { systemTileStyle } from '@/lib/system-colors';
import type { BotPost } from '@/types/bots';
import type { System } from '@/types/system';

const DESCRIPTION_LIMIT = 500;

type Props = {
    bot: BotPost;
    index: number;
    onEdit?: () => void;
    onDelete?: () => void;
};

function formatWhen(date: Date) {
    if (isToday(date)) {
        return `Today · ${format(date, 'HH:mm')}`;
    }

    if (isTomorrow(date)) {
        return `Tomorrow · ${format(date, 'HH:mm')}`;
    }

    return `${format(date, 'EEE')} · ${format(date, 'HH:mm')}`;
}

function truncate(text: string, limit: number) {
    if (text.length <= limit) {
        return text;
    }

    return `${text.slice(0, limit).trimEnd()}…`;
}

function ChannelIconStack({ systems }: { systems: System[] }) {
    return (
        <span className="flex items-center -space-x-1">
            {systems.map((sys) => (
                <span
                    key={sys.id}
                    {...systemTileStyle(
                        sys,
                        'grid size-5 place-items-center rounded ring-1 ring-card',
                    )}
                    title={sys.name}
                >
                    <SystemIcon icon={sys.icon} size={11} />
                </span>
            ))}
        </span>
    );
}

export function BotRow({ bot, index, onEdit, onDelete }: Props) {
    const channels = bot.bot_post_systems ?? [];
    const systems = channels.map((channel) => channel.user_token.system);
    const times = bot.post_times ?? [];
    const nextPostAt = bot.next_post_at ? new Date(bot.next_post_at) : null;
    const description = truncate(
        bot.bot_description?.trim() ?? '',
        DESCRIPTION_LIMIT,
    );

    const cadenceLabel =
        times.length > 0
            ? `${times.length}× / day`
            : 'No schedule';

    return (
        <li className="group flex items-stretch gap-4 border-b border-border bg-card py-3 transition-colors last:border-b-0 hover:bg-accent/30">
            <div className="flex w-32 shrink-0 flex-col leading-tight pl-5 pt-2.5">
                <span className="font-sans text-[15px] text-foreground">
                    {nextPostAt ? formatWhen(nextPostAt) : 'Idle'}
                </span>
                <span className="mt-1 font-mono text-[10px] font-semibold tracking-widest text-primary uppercase">
                    B-{String(index + 1).padStart(2, '0')} · {cadenceLabel}
                </span>
                {nextPostAt && (
                    <span className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                        in {formatDistanceToNow(nextPostAt)}
                    </span>
                )}
            </div>

            <div className="flex min-w-0 flex-1 items-start gap-3 px-5 py-2">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {systems.length > 0 ? (
                            <>
                                <ChannelIconStack systems={systems} />
                                <span className="truncate text-[12px] font-semibold text-foreground">
                                    {systems
                                        .map((system) => system.name)
                                        .join(' · ')}
                                </span>
                            </>
                        ) : (
                            <span className="text-[12px] font-semibold text-muted-foreground">
                                No channels
                            </span>
                        )}
                        {times.length > 0 && (
                            <span className="font-mono text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
                                {times.join(' · ')}
                            </span>
                        )}
                    </div>

                    <p className="text-[13px] leading-snug text-foreground/90">
                        {description ? (
                            description
                        ) : (
                            <span className="font-sans text-muted-foreground">
                                No description yet
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-1 pt-px">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onEdit}
                        aria-label="Edit bot"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <Pencil className="size-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onDelete}
                        aria-label="Delete bot"
                        className="text-muted-foreground hover:text-destructive"
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
            </div>
        </li>
    );
}

export default BotRow;
