import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { FacebookPages } from '@/types/system';

type Props = {
    pages: FacebookPages[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function PageSelectDialog({ pages, open, onOpenChange }: Props) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const hasPages = pages.length > 0;
    const selectedPage = pages.find((page) => page.id === selectedId) ?? null;

    function confirm() {
        if (!selectedPage) {
            return;
        }

        router.post(
            '/auth/finishAccountCreation',
            {
                id: selectedPage.id,
                name: selectedPage.name,
                system_id: selectedPage.system_id,
                access_token: selectedPage.access_token,
            },
            {
                onStart: () => setSubmitting(true),
                onFinish: () => setSubmitting(false),
                onSuccess: () => onOpenChange(false),
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Choose a page</DialogTitle>
                    <DialogDescription>
                        {hasPages
                            ? 'Select which page TruePost should dispatch on behalf of. You can only pick one.'
                            : 'We could not find any pages on this account.'}
                    </DialogDescription>
                </DialogHeader>

                {hasPages ? (
                    <div
                        role="radiogroup"
                        aria-label="Available pages"
                        className="flex max-h-72 flex-col gap-2 overflow-y-auto"
                    >
                        {pages.map((page) => {
                            const selected = page.id === selectedId;

                            return (
                                <label
                                    key={page.id}
                                    className={cn(
                                        'flex cursor-pointer items-center gap-3 rounded-xl border bg-card p-3 shadow-sm transition-colors',
                                        selected
                                            ? 'border-primary ring-1 ring-primary'
                                            : 'border-border hover:border-primary/50',
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="page-to-select"
                                        value={page.id}
                                        checked={selected}
                                        onChange={() => setSelectedId(page.id)}
                                        className="size-4 shrink-0 accent-primary"
                                    />
                                    <span className="truncate text-[14px] font-medium text-foreground">
                                        {page.name}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                ) : (
                    <p className="rounded-xl border border-dashed border-border bg-card/50 p-4 text-[13px] text-muted-foreground">
                        There is nothing to connect right now. Make sure the
                        account manages at least one page, then try connecting
                        again.
                    </p>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {hasPages ? 'Cancel' : 'Close'}
                    </Button>
                    {hasPages && (
                        <Button
                            type="button"
                            disabled={!selectedPage || submitting}
                            onClick={confirm}
                        >
                            {submitting ? 'Connecting…' : 'Connect page'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default PageSelectDialog;
