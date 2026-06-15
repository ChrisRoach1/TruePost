import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { System } from '@/types';

type Props = {
    systems: System[];
    onConnect: (platform: System) => void;
};

export function AvailablePlatforms({ systems, onConnect }: Props) {
    if (systems.length === 0) {
        return null;
    }

    return (
        <section className="space-y-3 pt-2">
            <header className="flex items-baseline gap-2">
                <span className="font-mono text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                    Available
                </span>
                <span className="text-[18px] font-semibold tracking-tight text-foreground">
                    Not yet
                </span>
                <span className="font-serif text-[18px] italic text-primary">
                    connected
                </span>
            </header>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {systems.map((platform) => (
                    <button
                        key={platform.id}
                        type="button"
                        onClick={() => onConnect(platform)}
                        className={cn(
                            'group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors',
                            'hover:border-foreground/30 hover:bg-muted/40',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="flex size-8 shrink-0 items-center justify-center rounded-md"
                                style={{
                                    backgroundColor: `${platform.background_color}15`,
                                }}
                            >
                                <svg
                                    className="size-4"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    style={{ color: platform.icon_color }}
                                >
                                    <path d={platform.icon} />
                                </svg>
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span className="text-[14px] font-semibold tracking-tight text-foreground">
                                    {platform.name}
                                </span>
                                <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                                    Not connected
                                </span>
                            </div>
                        </div>
                        <span className="flex items-center gap-1 font-mono text-[11px] font-semibold tracking-widest text-primary uppercase transition-transform group-hover:translate-x-0.5">
                            Connect
                            <ArrowRight className="size-3" />
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}

export default AvailablePlatforms;
