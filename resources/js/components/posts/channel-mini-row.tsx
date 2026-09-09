import { AlertTriangle } from 'lucide-react';
import type {ReactNode} from 'react';
import { SystemIcon } from '@/components/system-icon';
import { systemTileStyle } from '@/lib/system-colors';
import { cn } from '@/lib/utils';
import type { System } from '@/types/system';

export type RowTone = 'default' | 'danger';

type Props = {
    system?: System;
    name?: string;
    text: string | null | undefined;
    error?: string | null;
    status?: string;
    badge?: string;
    tone?: RowTone;
    trailing?: ReactNode;
    isFirst?: boolean;
};

function ChannelIcon({ system }: { system: System }) {
    return (
        <span
            {...systemTileStyle(
                system,
                'grid size-5 place-items-center rounded',
            )}
            title={system.name}
        >
            <SystemIcon icon={system.icon} size={11} />
        </span>
    );
}

export function ChannelMiniRow({
    system,
    name,
    text,
    error,
    status,
    badge,
    tone = 'default',
    trailing,
    isFirst = false,
}: Props) {
    const displayName = name ?? system?.name ?? '';
    const trimmedText = text?.trim() ?? '';
    const trimmedError = error?.trim() ?? '';

    return (
        <div
            className={cn(
                'flex items-start gap-3 px-5 py-2.5',
                !isFirst && 'border-t border-dashed border-border/60',
                tone === 'danger' && 'bg-destructive/[0.04]',
            )}
        >
            <div className="flex w-36 shrink-0 items-start gap-2 pt-px">
                {system && <ChannelIcon system={system} />}
                <div className="flex min-w-0 flex-col leading-tight">
                    {displayName && (
                        <span className="truncate text-[12px] font-semibold text-foreground">
                            {displayName}
                        </span>
                    )}
                    {status && (
                        <span
                            className={cn(
                                'mt-0.5 font-mono text-[9px] font-semibold tracking-widest uppercase',
                                tone === 'danger'
                                    ? 'text-destructive'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {status}
                        </span>
                    )}
                </div>
                {badge && (
                    <span className="shrink-0 font-mono text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
                        {badge}
                    </span>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-[13px] leading-snug text-foreground/90">
                    {trimmedText ? (
                        trimmedText
                    ) : (
                        <span className="font-sans text-muted-foreground">
                            No content yet
                        </span>
                    )}
                </p>

                {trimmedError && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-snug text-destructive">
                        <AlertTriangle className="mt-px size-3 shrink-0" />
                        <span className="line-clamp-2 min-w-0">
                            {trimmedError}
                        </span>
                    </p>
                )}
            </div>

            <div className="flex shrink-0 items-center gap-1 pt-px">
                {trailing}
            </div>
        </div>
    );
}

export default ChannelMiniRow;
