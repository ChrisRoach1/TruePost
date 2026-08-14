import { Head, Link, router } from '@inertiajs/react';
import { Bot } from 'lucide-react';
import { useState } from 'react';
import BotRow from '@/components/bots/bot-row';
import EditBot from '@/components/edit-bot';
import { Button } from '@/components/ui/button';
import { deleteMethod } from '@/routes/bot';
import bots from '@/routes/bots';
import { bot } from '@/routes/create';
import type { System, UserToken } from '@/types';
import type { BotPost } from '@/types/bots';

type Props = {
    bots?: BotPost[];
    connectedAccounts?: UserToken[];
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
            <span className="font-sans text-[18px] text-primary">
                {accent}
            </span>
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
    const [editingBot, setEditingBot] = useState<BotPost | null>(null);

    function deleteBot(botId: number): void {
        router.delete(deleteMethod(botId));
    }

    return (
        <>
            <Head title="Bots" />
            <div className="flex h-full flex-1 flex-col overflow-x-auto p-4">
                <div className="mx-auto w-full max-w-6xl space-y-8">
                    <header className="flex items-start justify-between gap-4 pt-2">
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
                        <div className="flex items-center gap-2">
                            <Button asChild>
                                <Link href={bot().url}>
                                    <Bot className="size-3.5" />
                                    New bot
                                </Link>
                            </Button>
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
                                <Button asChild className="mt-5">
                                    <Link href={bot().url}>
                                        <Bot className="size-3.5" />
                                        Create your first bot
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </section>
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
