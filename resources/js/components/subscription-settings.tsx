import { router, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import subscription from '@/routes/subscription';

const PRO_FEATURES = [
    'Unlimited connected accounts',
    'Unlimited scheduled posts',
    'Per-channel AI rewrites',
    '5 bots on any channels',
];

export default function SubscriptionSettings() {
    const { auth } = usePage().props;

    const checkout = () => {
        window.location.href = subscription.checkout().url;
    };

    return (
        <div className="space-y-6">
            <Heading
                variant="small"
                title="Subscription"
                description="Manage your plan and billing"
            />

            {auth.is_pro_member ? (
                <ProPlanCard isInGracePeriod={auth.is_in_grace_period} />
            ) : (
                <FreePlanCard onUpgrade={checkout} />
            )}
        </div>
    );
}

function FreePlanCard({ onUpgrade }: { onUpgrade: () => void }) {
    return (
        <div className="space-y-5 rounded-xl border border-dashed border-border bg-card/50 p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <span className="font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                        Current plan · Free
                    </span>
                    <p className="text-[18px] font-semibold tracking-tight text-foreground">
                        Go <span className="font-sans text-primary">Pro</span>
                    </p>
                </div>
                <div className="flex items-baseline gap-1 text-foreground">
                    <span className="text-[28px] font-bold tracking-tight">
                        $8
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                        / month
                    </span>
                </div>
            </div>

            <FeatureList />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                    type="button"
                    onClick={onUpgrade}
                    data-test="upgrade-to-pro-button"
                >
                    Upgrade to Pro
                </Button>
                <span className="text-[11px] text-muted-foreground">
                    Cancel anytime.
                </span>
            </div>
        </div>
    );
}

function ProPlanCard({ isInGracePeriod }: { isInGracePeriod: boolean }) {
    return (
        <div className="space-y-5 rounded-xl border border-primary/30 bg-primary/5 p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <span className="font-mono text-[10px] font-semibold tracking-widest text-primary uppercase">
                        {isInGracePeriod
                            ? 'Current plan · Cancelling'
                            : 'Current plan'}
                    </span>
                    <p className="flex items-center gap-2 text-[18px] font-semibold tracking-tight text-foreground">
                        TruePost{' '}
                        <span className="font-sans text-primary">Pro</span>
                    </p>
                </div>
                <div className="flex items-baseline gap-1 text-foreground">
                    <span className="text-[28px] font-bold tracking-tight">
                        $8
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                        / month
                    </span>
                </div>
            </div>

            <FeatureList />

            <div className="flex flex-col gap-2 border-t border-dashed border-primary/20 pt-4 sm:flex-row sm:items-center sm:justify-between">
                {isInGracePeriod ? (
                    <span
                        className="text-[11px] text-muted-foreground"
                        data-test="subscription-cancelled-notice"
                    >
                        Your subscription is already cancelled. Pro stays active
                        until the end of your current billing period.
                    </span>
                ) : (
                    <>
                        <span className="text-[11px] text-muted-foreground">
                            Thanks for supporting TruePost.
                        </span>
                        <CancelSubscriptionDialog />
                    </>
                )}
            </div>
        </div>
    );
}

function FeatureList() {
    return (
        <ul className="grid gap-2 sm:grid-cols-2">
            {PRO_FEATURES.map((feature) => (
                <li
                    key={feature}
                    className="flex items-start gap-2 text-[12.5px] leading-snug text-muted-foreground"
                >
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    {feature}
                </li>
            ))}
        </ul>
    );
}

function CancelSubscriptionDialog() {
    const cancel = () => {
        router.post(subscription.cancel());
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    data-test="cancel-subscription-button"
                >
                    Cancel subscription
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Cancel your Pro subscription?</DialogTitle>
                <DialogDescription>
                    You'll keep Pro until the end of your current billing
                    period. After that you'll drop back to the free plan, with
                    limited accounts and no AI rewrites.
                </DialogDescription>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Keep Pro</Button>
                    </DialogClose>

                    <DialogClose asChild>
                        <Button
                            variant="destructive"
                            data-test="confirm-cancel-subscription-button"
                            onClick={() => cancel()}
                        >
                            Cancel subscription
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
