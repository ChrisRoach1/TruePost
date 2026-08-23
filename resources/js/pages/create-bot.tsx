import { Head, usePage } from '@inertiajs/react';
import CreateBot from '@/components/create-bot';
import { bot } from '@/routes/create';
import type { ConnectedAccount, System } from '@/types';

type Props = {
    connectedAccounts?: ConnectedAccount[];
    systems?: System[];
    botCount?: number;
};

export default function AiBots({
    connectedAccounts = [],
    systems = [],
    botCount = 0,
}: Props) {
    const { auth } = usePage().props;
    const botLimit = auth.is_pro_member
        ? auth.pro_bot_limit
        : auth.solo_bot_limit;
    const atBotLimit = botCount >= botLimit;

    return (
        <>
            <Head title="AI Bots" />
            <div className="px-4 py-7 text-foreground">
                {atBotLimit ? (
                    <BotLimitNotice
                        limit={botLimit}
                        isPro={auth.is_pro_member}
                    />
                ) : (
                    <CreateBot
                        connectedAccounts={connectedAccounts}
                        systems={systems}
                    />
                )}
            </div>
        </>
    );
}

function BotLimitNotice({ limit, isPro }: { limit: number; isPro: boolean }) {
    const botLabel = limit === 1 ? 'bot' : 'bots';

    return (
        <section className="space-y-3">
            <header className="flex items-baseline gap-2">
                <span className="text-[18px] font-semibold tracking-tight text-foreground">
                    Your bot roster is
                </span>
                <span className="font-sans text-[18px] text-primary">full</span>
            </header>

            <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border bg-card/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <span className="font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                        {isPro ? 'Pro plan' : 'Solo plan'} · {limit} of {limit}{' '}
                        {botLabel}
                    </span>
                    <p className="max-w-lg text-[12px] leading-relaxed text-muted-foreground">
                        {isPro
                            ? "You've created every bot your plan allows. Delete one to make room."
                            : "You've created every bot your plan allows. Upgrade to Pro for more bots, or delete one to make room."}
                    </p>
                </div>
            </div>
        </section>
    );
}

AiBots.layout = {
    breadcrumbs: [
        {
            title: 'Create Bot',
            href: bot(),
        },
    ],
};
