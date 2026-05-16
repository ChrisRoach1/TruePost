import { cn } from '@/lib/utils';

type Props = {
    pct: number;
    over: boolean;
};

export function CounterRing({ pct, over }: Props) {
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

export default CounterRing;
