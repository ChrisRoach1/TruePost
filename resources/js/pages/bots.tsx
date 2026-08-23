import { Head, Link, router, usePage } from '@inertiajs/react';
import { Bot } from 'lucide-react';
import { useState } from 'react';
import BotRow from '@/components/bots/bot-row';
import EditBot from '@/components/edit-bot';
import { Button } from '@/components/ui/button';
import { deleteMethod } from '@/routes/bot';
import bots from '@/routes/bots';
import { bot } from '@/routes/create';
import type { System, ConnectedAccount } from '@/types';
import type { BotPost } from '@/types/bots';

type Props = {
    bots?: BotPost[];
    connectedAccounts?: ConnectedAccount[];
    systems?: System[];
};

function SectionHeader({
    number,
    label,
    accent,
    count,
}: {
    number: string;
    label: string;
    accent: string;
    count: number;
}) {
    return (
        <div className="flex items-baseline gap-2 px-1 pb-3">
            <span className="font-mono text-[11px] font-semibold text-primary">
                {number}
            </span>
            <span className="text-[18px] font-semibold tracking-tight text-foreground">
                {label}
            </span>
            <span className="font-sans text-[18px] text-primary">{accent}</span>
            <span className="font-mono text-[11px] text-muted-foreground">
                · {count}
            </span>
        </div>
    );
}

export default function Bots({
    bots: botList = [],
    connectedAccounts = [],
    systems = [],
}: Props) {
    const { auth } = usePage().props;
    const [editingBot, setEditingBot] = useState<BotPost | null>(null);

    const botLimit = auth.is_pro_member
        ? auth.pro_bot_limit
        : auth.solo_bot_limit;
    const atBotLimit = botList.length >= botLimit;
    const botLabel = botLimit === 1 ? 'bot' : 'bots';

    function deleteBot(botId: number): void {
        router.delete(deleteMethod(botId));
    }

    return (
        <>
            <Head title="Bots" />
            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="mx-auto w-full max-w-6xl space-y-8">
                    <header className="flex flex-col gap-4 pt-2 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                            <span className="font-mono text-[11px] font-semibold tracking-widest text-primary uppercase">
                                The archive
                            </span>
                            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                                Every{' '}
                                <span className="font-sans text-primary">
                                    bot
                                </span>{' '}
                                you've ever made.
                            </h1>
                        </div>
                        <div className="flex flex-col gap-3 md:items-end">
                            <div className="flex flex-col gap-1 md:items-end">
                                <span className="font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                                    {auth.is_pro_member
                                        ? 'Pro plan'
                                        : 'Solo plan'}
                                </span>
                                <span className="font-mono text-[12px] text-foreground">
                                    {Math.min(botList.length, botLimit)} of{' '}
                                    {botLimit} {botLabel}
                                </span>
                            </div>
                            {!atBotLimit && (
                                <Button asChild>
                                    <Link href={bot().url}>
                                        <Bot className="size-3.5" />
                                        New bot
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </header>

                    <section>
                        <SectionHeader
                            number="01"
                            label="In"
                            accent="rotation"
                            count={botList.length}
                        />
                        {botList.length > 0 ? (
                            <ul className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                                {botList.map((item, i) => (
                                    <BotRow
                                        key={item.id}
                                        bot={item}
                                        index={i}
                                        onEdit={() => setEditingBot(item)}
                                        onDelete={() => deleteBot(item.id)}
                                    />
                                ))}
                            </ul>
                        ) : (
                            <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
                                <p className="text-[15px] text-foreground">
                                    No bots yet.
                                </p>
                                <p className="mt-1 text-[13px] text-muted-foreground">
                                    Set one up once and it posts for you every
                                    day.
                                </p>
                                {!atBotLimit && (
                                    <Button asChild className="mt-5">
                                        <Link href={bot().url}>
                                            <Bot className="size-3.5" />
                                            Create your first bot
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        )}
                    </section>

                    {atBotLimit && botList.length > 0 && (
                        <div className="flex flex-col gap-4 rounded-xl border border-dashed border-border bg-card/50 p-4">
                            <div className="space-y-1">
                                <span className="font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                                    {auth.is_pro_member
                                        ? 'Pro plan'
                                        : 'Solo plan'}{' '}
                                    · {botLimit} of {botLimit} {botLabel}
                                </span>
                                <p className="max-w-lg text-[12px] leading-relaxed text-muted-foreground">
                                    {auth.is_pro_member
                                        ? "You've created every bot your plan allows. Delete one above to make room."
                                        : "You've created every bot your plan allows. Upgrade to Pro for more bots, or delete one above to make room."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {editingBot && (
                <EditBot
                    bot={editingBot}
                    connectedAccounts={connectedAccounts}
                    systems={systems}
                    open={!!editingBot}
                    onOpenChange={(o) => {
                        if (!o) {
                            setEditingBot(null);
                        }
                    }}
                />
            )}
        </>
    );
}

Bots.layout = {
    breadcrumbs: [
        {
            title: 'Bots',
            href: bots.list(),
        },
    ],
};
