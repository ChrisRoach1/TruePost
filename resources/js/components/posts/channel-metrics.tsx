import type { userPostSystems } from '@/types/userPosts';

function Metric({ label, value }: { label: string; value: number }) {
    return (
        <span className="flex items-baseline gap-1">
            <span className="font-sans text-[13px] tabular-nums text-foreground">
                {value > 0 ? value.toLocaleString() : '—'}
            </span>
            <span className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase">
                {label}
            </span>
        </span>
    );
}

export function ChannelMetrics({ channel }: { channel: userPostSystems }) {
    return (
        <div className="flex items-center gap-4 pl-3">
            <Metric label="Impressions" value={channel.impressions ?? 0} />
            <Metric label="Likes" value={channel.likes ?? 0} />
            <Metric label="Replies" value={channel.replies ?? 0} />
        </div>
    );
}

export default ChannelMetrics;
