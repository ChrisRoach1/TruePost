import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { System } from '@/types/system';

type Props = {
    system?: System;
    systems?: System[];
    name?: string;
    text: string | null | undefined;
    badge?: string;
    trailing?: ReactNode;
    isFirst?: boolean;
};

function ChannelIcon({ system }: { system: System }) {
    return (
        <span
            className="grid size-5 place-items-center rounded text-white"
            style={{ backgroundColor: system.background_color }}
            title={system.name}
        >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d={system.icon} />
            </svg>
        </span>
    );
}

function ChannelIconStack({ systems }: { systems: System[] }) {
    return (
        <span className="flex items-center -space-x-1">
            {systems.map((sys) => (
                <span
                    key={sys.id}
                    className="grid size-5 place-items-center rounded text-white ring-1 ring-card"
                    style={{ backgroundColor: sys.background_color }}
                    title={sys.name}
                >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                        <path d={sys.icon} />
                    </svg>
                </span>
            ))}
        </span>
    );
}

export function ChannelMiniRow({
    system,
    systems,
    name,
    text,
    badge,
    trailing,
    isFirst = false,
}: Props) {
    const displayName =
        name ??
        (system
            ? system.name
            : systems && systems.length > 0
              ? systems.map((s) => s.name).join(' · ')
              : '');
    const trimmedText = text?.trim() ?? '';

    return (
        <div
            className={cn(
                'flex items-start gap-3 px-5 py-2.5',
                !isFirst && 'border-t border-dashed border-border/60',
            )}
        >
            <div className="flex w-32 shrink-0 items-center gap-2 pt-px">
                {systems && systems.length > 0 ? (
                    <ChannelIconStack systems={systems} />
                ) : system ? (
                    <ChannelIcon system={system} />
                ) : null}
                {displayName && (
                    <span className="truncate text-[12px] font-semibold text-foreground">
                        {displayName}
                    </span>
                )}
                {badge && (
                    <span className="shrink-0 font-mono text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
                        {badge}
                    </span>
                )}
            </div>

            <p className="line-clamp-1 min-w-0 flex-1 text-[13px] leading-snug text-foreground/90">
                {trimmedText ? (
                    trimmedText
                ) : (
                    <span className="font-sans text-muted-foreground">
                        No content yet
                    </span>
                )}
            </p>

            <div className="flex shrink-0 items-center gap-1 pt-px">
                {trailing}
            </div>
        </div>
    );
}

export default ChannelMiniRow;
