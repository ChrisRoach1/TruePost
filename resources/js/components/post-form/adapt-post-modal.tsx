import { router } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';
import { AdaptChannelDraft } from '@/components/post-form/adapt-channel-draft';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { generateAICustomizedPost } from '@/routes/userPost';
import type { ConnectedAccount } from '@/types';
import type { ToneId, AdaptGenerator, DraftState } from '@/types/userPosts';


const TONES: { id: ToneId; label: string }[] = [
    { id: 'keep', label: 'Keep my voice' },
    { id: 'punchier', label: 'Punchier' },
    { id: 'warmer', label: 'Warmer' },
    { id: 'professional', label: 'More professional' },
    { id: 'playful', label: 'Playful' },
];

/**
 * Placeholder until a real rewrite endpoint exists. Kept at module scope so the
 * reference stays stable across renders.
 */
const mockGenerate: AdaptGenerator = ({ content, tone, notes }) =>
    new Promise((resolve) => {

        const response =router.post(generateAICustomizedPost(), {
            content: content,
            notes: notes,
            tone: tone
        });

        console.log(response);

        window.setTimeout(
            () => {
                const aside = notes.trim() ? ` Also: ${notes.trim()}.` : '';

                resolve(
                    `${content.trim()}${aside} (${tone} draft — placeholder text until generation is wired up.)`,
                );
            },
            700 + Math.random() * 800,
        );
    });

function plural(count: number, word: string): string {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
}

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The text the composer currently holds, and the fallback for skipped channels. */
    original: string;
    /** Only the channels the post is actually going out to. */
    accounts: ConnectedAccount[];
    onApply: (results: Record<number, string>) => void;
    generate?: AdaptGenerator;
};

export function AdaptPostModal({
    open,
    onOpenChange,
    original,
    accounts,
    onApply,
    generate = mockGenerate,
}: Props) {
    const [step, setStep] = useState<'brief' | 'review'>('brief');
    const [tone, setTone] = useState<ToneId>('keep');
    const [notes, setNotes] = useState('');
    const [run, setRun] = useState(0);
    const [drafts, setDrafts] = useState<Record<number, DraftState>>({});

    const channels = accounts
        .slice()
        .sort((a, b) => a.system.order - b.system.order);

    const handleDraftChange = useCallback(
        (accountId: number, state: DraftState) => {
            setDrafts((prev) => {
                const current = prev[accountId];

                if (
                    current &&
                    current.text === state.text &&
                    current.use === state.use &&
                    current.status === state.status
                ) {
                    return prev;
                }

                return { ...prev, [accountId]: state };
            });
        },
        [],
    );

    function handleOpenChange(next: boolean) {
        if (!next) {
            setStep('brief');
            setDrafts({});
        }

        onOpenChange(next);
    }

    function startRun() {
        setDrafts({});
        setRun((previous) => previous + 1);
        setStep('review');
    }

    function apply() {
        const results: Record<number, string> = {};

        for (const account of channels) {
            const draft = drafts[account.id];

            results[account.id] =
                draft?.status === 'ready' && draft.use ? draft.text : original;
        }

        onApply(results);
        handleOpenChange(false);
    }

    const stillWriting = channels.some(
        (account) => (drafts[account.id]?.status ?? 'loading') === 'loading',
    );
    const applyingCount = channels.filter((account) => {
        const draft = drafts[account.id];

        return draft?.status === 'ready' && draft.use;
    }).length;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
                <div className="shrink-0 border-b border-border bg-muted/40 px-4 pt-6 pb-5 sm:px-6">
                    <p className="text-[11px] font-semibold tracking-widest text-primary uppercase">
                        {step === 'brief'
                            ? 'Step 1 — Brief'
                            : 'Step 2 — Review'}
                    </p>
                    <DialogTitle className="mt-2.5 text-xl font-semibold tracking-tight text-foreground">
                        {step === 'brief' ? (
                            <>
                                Adapt this post{' '}
                                <span className="text-primary">
                                    per channel
                                </span>
                            </>
                        ) : (
                            <>
                                Review before{' '}
                                <span className="text-primary">
                                    anything ships
                                </span>
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription className="mt-1.5 text-[13px]">
                        {step === 'brief'
                            ? "Nothing is posted or overwritten yet. You'll see every version and decide what to keep."
                            : 'Edit anything in place, regenerate a single channel, or skip it and keep your original.'}
                    </DialogDescription>
                </div>

                {step === 'brief' ? (
                    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
                        <div className="space-y-1.5">
                            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                                Your original
                            </p>
                            <div className="rounded-xl border border-dashed border-border bg-card p-3.5 text-[15px] leading-relaxed whitespace-pre-wrap text-foreground">
                                {original}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                                Tone
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {TONES.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setTone(option.id)}
                                        className={cn(
                                            'rounded-full border px-3 py-1.5 text-[13px] transition-colors',
                                            tone === option.id
                                                ? 'border-foreground bg-foreground font-semibold text-background'
                                                : 'border-border font-medium text-muted-foreground hover:text-foreground',
                                        )}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="adapt-notes"
                                className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase"
                            >
                                Anything else? (optional)
                            </label>
                            <Input
                                id="adapt-notes"
                                value={notes}
                                onChange={(event) =>
                                    setNotes(event.target.value)
                                }
                                placeholder="e.g. mention the beta is free, don't use emoji"
                                className="h-10 text-[15px]"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-muted/30 px-4 py-5 sm:px-6">
                        {channels.map((account) => (
                            <AdaptChannelDraft
                                key={`${run}-${account.id}`}
                                account={account}
                                original={original}
                                tone={tone}
                                notes={notes}
                                generate={generate}
                                onChange={handleDraftChange}
                            />
                        ))}
                    </div>
                )}

                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-4 sm:px-6">
                    <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
                        {step === 'brief'
                            ? `${plural(channels.length, 'version')} · nothing posted`
                            : `${applyingCount} of ${channels.length} will be applied`}
                    </p>

                    {step === 'brief' ? (
                        <div className="flex w-full justify-end gap-2 sm:w-auto">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={startRun}
                                className="bg-foreground text-background hover:bg-foreground/90"
                            >
                                Generate {plural(channels.length, 'version')}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex w-full justify-end gap-2 sm:w-auto">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep('brief')}
                            >
                                &larr; Back to brief
                            </Button>
                            <Button
                                type="button"
                                onClick={apply}
                                disabled={stillWriting}
                                className="bg-foreground text-background hover:bg-foreground/90"
                            >
                                Apply to {plural(channels.length, 'channel')}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function AdaptPostButton({
    count,
    disabled,
    onClick,
}: {
    count: number;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <Button
            type="button"
            size="sm"
            onClick={onClick}
            disabled={disabled}
            title="Adapt for each channel"
            aria-label="Adapt for each channel"
            className="gap-1.5 rounded-full bg-foreground text-background hover:bg-foreground/90"
        >
            <Sparkles className="size-3.5 text-primary" />
            <span className="hidden sm:inline">Adapt for each channel</span>
            <span className="rounded-sm bg-background/15 px-1.5 py-0.5 font-mono text-[10px] tabular-nums">
                {count}
            </span>
        </Button>
    );
}

export default AdaptPostModal;
