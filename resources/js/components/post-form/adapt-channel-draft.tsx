import { RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SystemIcon } from '@/components/system-icon';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { systemTileStyle } from '@/lib/system-colors';
import { cn } from '@/lib/utils';
import type { ConnectedAccount } from '@/types';
import type { ToneId, AdaptGenerator, DraftState, DraftStatus } from '@/types/userPosts';



type Props = {
    account: ConnectedAccount;
    original: string;
    tone: ToneId;
    notes: string;
    generate: AdaptGenerator;
    onChange: (accountId: number, state: DraftState) => void;
};

export function AdaptChannelDraft({
    account,
    original,
    tone,
    notes,
    generate,
    onChange,
}: Props) {
    const [status, setStatus] = useState<DraftStatus>('loading');
    const [text, setText] = useState('');
    const [use, setUse] = useState(true);


    const runId = useRef(0);

    const start = useCallback(() => {
        const thisRun = ++runId.current;

        generate({ accountId: account.id, content: original, tone, notes })
            .then((result) => {
                if (thisRun !== runId.current) {
                    return;
                }

                setText(result);
                setUse(true);
                setStatus('ready');
            })
            .catch(() => {
                if (thisRun !== runId.current) {
                    return;
                }

                setUse(false);
                setStatus('error');
            });
    }, [account.id, generate, notes, original, tone]);


    useEffect(() => {
        start();
    }, [start]);

    useEffect(() => {
        onChange(account.id, { text, use, status });
    }, [account.id, onChange, status, text, use]);

    function regenerate() {
        setStatus('loading');
        start();
    }

    function useOriginal() {
        runId.current += 1;
        setText(original);
        setUse(false);
        setStatus('ready');
    }

    const limit = account.system.max_post_length;
    const over = text.length > limit;

    return (
        <div className="rounded-xl border border-border bg-card p-3.5">
            <div className="flex flex-wrap items-center gap-2">
                <span
                    {...systemTileStyle(
                        account.system,
                        'grid size-6 shrink-0 place-items-center rounded-md',
                    )}
                >
                    <SystemIcon icon={account.system.icon} size={13} />
                </span>
                <span className="text-[13px] font-semibold text-foreground">
                    {account.system.name}
                </span>

                <div className="ml-auto flex items-center gap-2">
                    {status === 'ready' && (
                        <span
                            className={cn(
                                'font-mono text-[11px] tabular-nums',
                                over
                                    ? 'text-destructive'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {text.length}/{limit.toLocaleString()}
                        </span>
                    )}
                    <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                        <Switch
                            size="sm"
                            checked={use}
                            onCheckedChange={setUse}
                            disabled={status !== 'ready'}
                            aria-label={`Use the rewrite for ${account.system.name}`}
                        />
                        Use
                    </label>
                </div>
            </div>

            {status === 'loading' ? (
                <div className="mt-3 flex items-center gap-2 border-b border-dashed border-border pb-3 text-[13px] text-muted-foreground">
                    <Spinner className="size-3.5" />
                    Writing a version for {account.system.name}…
                </div>
            ) : status === 'error' ? (
                <div className="mt-3 border-b border-dashed border-border pb-3 text-[13px] text-destructive">
                    That one didn't come back. Try regenerating, or keep your
                    original.
                </div>
            ) : (
                <Textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    aria-label={`${account.system.name} version`}
                    className="mt-2 min-h-20 resize-y rounded-none border-0 border-b border-dashed border-border px-0 py-2 text-[15px] leading-relaxed shadow-none focus-visible:border-border focus-visible:ring-0"
                />
            )}

            <div className="mt-3 flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={regenerate}
                    disabled={status === 'loading'}
                    className="font-mono text-[10px] tracking-widest uppercase"
                >
                    <RotateCcw className="size-3" />
                    Regenerate
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={useOriginal}
                    className="font-mono text-[10px] tracking-widest uppercase"
                >
                    Use original
                </Button>
            </div>
        </div>
    );
}

export default AdaptChannelDraft;
