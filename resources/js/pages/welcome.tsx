import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dashboard, login, register } from '@/routes';

// ── Channel definitions (external brand colors kept as-is) ──────────────────
type Channel = { id: string; name: string; color: string; letter: string };

const CHANNELS: Channel[] = [
    { id: 'facebook', name: 'Facebook', color: '#1877F2', letter: 'f' },
    { id: 'instagram', name: 'Instagram', color: '#E4405F', letter: 'Ig' },
    { id: 'x', name: 'X', color: '#000000', letter: '𝕏' },
    { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', letter: 'in' },
    { id: 'threads', name: 'Threads', color: '#000000', letter: '@' },
    { id: 'youtube', name: 'YouTube Shorts', color: '#FF0033', letter: '▶' },
];

const channelById = (id: string) => CHANNELS.find((c) => c.id === id);

// ── Hooks ───────────────────────────────────────────────────────────────────
function useReveal() {
    useEffect(() => {
        const els = Array.from(
            document.querySelectorAll<HTMLElement>('.tp-reveal'),
        );

        if (!('IntersectionObserver' in window)) {
            els.forEach((e) => e.classList.add('tp-in'));

            return;
        }

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((en) => {
                    if (en.isIntersecting) {
                        en.target.classList.add('tp-in');
                        io.unobserve(en.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
        );
        els.forEach((e) => io.observe(e));

        return () => io.disconnect();
    }, []);
}

function useScrolled(threshold = 24) {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > threshold);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, [threshold]);

    return scrolled;
}

// ── Small building blocks ─────────────────────────────────────────────────────
function Reveal({
    children,
    delay = 0,
    className,
    ...rest
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('tp-reveal', className)}
            style={{ transitionDelay: `${delay}ms` }}
            {...rest}
        >
            {children}
        </div>
    );
}

function BrandMark({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 32 32"
            className={cn('shrink-0', className)}
            aria-hidden
        >
            <rect
                x="3"
                y="3"
                width="26"
                height="26"
                rx="7.5"
                className="fill-primary"
            />
            <path
                d="M 8 16 L 22 11 L 18 22 L 16 18 Z"
                className="fill-background"
            />
            <path d="M 8 16 L 16 18 L 18 22 Z" className="fill-primary/40" />
        </svg>
    );
}

function Wordmark({ className }: { className?: string }) {
    return (
        <span
            className={cn(
                'font-brand text-lg font-semibold tracking-tight',
                className,
            )}
        >
            <span className="text-foreground">True</span>
            <span className="text-primary">Post</span>
        </span>
    );
}

function Sparkle({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="none"
            className={cn('size-3.5', className)}
            aria-hidden
        >
            <path
                d="M8 1.5c.4 2.7 1.8 4.1 4.5 4.5-2.7.4-4.1 1.8-4.5 4.5-.4-2.7-1.8-4.1-4.5-4.5C6.2 5.6 7.6 4.2 8 1.5Z"
                fill="currentColor"
            />
            <path
                d="M13 10c.2 1.2.8 1.8 2 2-1.2.2-1.8.8-2 2-.2-1.2-.8-1.8-2-2 1.2-.2 1.8-.8 2-2Z"
                fill="currentColor"
                opacity="0.7"
            />
        </svg>
    );
}

function ChannelPip({
    channel,
    size = 22,
    className,
}: {
    channel: Channel;
    size?: number;
    className?: string;
}) {
    const isBlack = channel.color === '#000000';

    return (
        <span
            className={cn(
                'inline-grid shrink-0 place-items-center font-brand font-bold text-white',
                isBlack && 'bg-neutral-900 dark:bg-neutral-700',
                className,
            )}
            style={{
                width: size,
                height: size,
                borderRadius: Math.round(size * 0.3),
                fontSize: Math.round(size * 0.5),
                ...(isBlack ? {} : { background: channel.color }),
            }}
        >
            {channel.letter}
        </span>
    );
}

function Eyebrow({ children }: { children: ReactNode }) {
    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 py-1.5 pr-3 pl-2 font-dm-mono text-[11px] font-medium tracking-[0.08em] text-primary uppercase">
            <Sparkle className="size-3 text-primary" />
            {children}
        </div>
    );
}

function SectionHead({
    kicker,
    title,
    accent,
    sub,
    center,
    className,
}: {
    kicker: string;
    title: string;
    accent?: string;
    sub?: string;
    center?: boolean;
    className?: string;
}) {
    return (
        <div
            className={cn(
                center ? 'mx-auto max-w-2xl text-center' : 'max-w-3xl',
                className,
            )}
        >
            <Reveal className="mb-3.5 font-dm-mono text-[11.5px] font-medium tracking-[0.14em] text-primary uppercase">
                {kicker}
            </Reveal>
            <Reveal delay={60}>
                <h2 className="font-brand text-[clamp(1.875rem,4vw,2.875rem)] leading-[1.08] font-semibold tracking-tight text-balance text-foreground">
                    {title}{' '}
                    {accent && <span className="text-primary">{accent}</span>}
                </h2>
            </Reveal>
            {sub && (
                <Reveal
                    delay={120}
                    className={cn(
                        'mt-4 max-w-xl text-[17px] leading-relaxed text-muted-foreground',
                        center && 'mx-auto',
                    )}
                >
                    {sub}
                </Reveal>
            )}
        </div>
    );
}

// ── Hero fan-out illustration ────────────────────────────────────────────────
const FANOUT = {
    draft: 'Shipped per-channel AI rewrites today — one draft becomes a native post everywhere.',
    cards: [
        {
            id: 'x',
            text: 'Shipped: per-channel AI rewrites. One draft → 6 native posts. No copy-paste tax.',
        },
        {
            id: 'linkedin',
            text: "Today we shipped per-channel AI rewrites. Write once — we adapt it to every channel you've connected.",
        },
        {
            id: 'instagram',
            text: 'compose once. post native everywhere ✨ new rewrites are live → link in bio',
        },
        {
            id: 'threads',
            text: 'one draft in, six native posts out. the copy-paste tax is dead 🪦',
        },
    ],
};

function HeroFanout() {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    const W = 600;
    const H = 480;

    useEffect(() => {
        const el = wrapRef.current;

        if (!el) {
            return;
        }

        const fit = () => setScale(Math.min(1, el.clientWidth / W));
        fit();
        const ro = new ResizeObserver(fit);
        ro.observe(el);

        return () => ro.disconnect();
    }, []);

    const cardYs = [24, 138, 252, 366];
    const cardH = 86;
    const draftCx = 150;
    const draftCy = H / 2;
    const offsets = [18, 0, 0, 18];

    const connectors = cardYs.map((y, i) => {
        const endX = W - 268 - offsets[i];
        const endY = y + cardH / 2;

        return { startX: draftCx, startY: draftCy, endX, endY, i };
    });

    return (
        <div
            ref={wrapRef}
            style={{ width: '100%', height: H * scale, position: 'relative' }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    width: W,
                    height: H,
                    transform: `translateX(-50%) scale(${scale})`,
                    transformOrigin: 'top center',
                }}
            >
                {/* Connectors */}
                <svg
                    width={W}
                    height={H}
                    viewBox={`0 0 ${W} ${H}`}
                    className="absolute inset-0 overflow-visible"
                >
                    {connectors.map(({ startX, startY, endX, endY, i }) => {
                        const midX = (startX + endX) / 2;
                        const d = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

                        return (
                            <g key={i}>
                                <path
                                    d={d}
                                    fill="none"
                                    className="stroke-primary"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    opacity={0.7}
                                />
                                <circle
                                    cx={endX}
                                    cy={endY}
                                    r={3.5}
                                    className="fill-primary"
                                    opacity={0.9}
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* Draft card */}
                <div
                    className="absolute rounded-2xl border border-border bg-card p-4 shadow-xl"
                    style={{ top: draftCy - 78, left: 0, width: 230 }}
                >
                    <div className="mb-2.5 inline-flex items-center gap-1.5 font-dm-mono text-[9.5px] tracking-[0.12em] text-muted-foreground uppercase">
                        <span className="size-1.5 rounded-full bg-primary" />
                        Your draft
                    </div>
                    <p className="text-[13.5px] leading-normal font-medium text-foreground">
                        {FANOUT.draft}
                    </p>
                    <div className="mt-3 flex items-center gap-2 border-t border-dashed border-border pt-3">
                        <span className="grid size-[22px] place-items-center rounded-md bg-primary/15">
                            <Sparkle className="size-3 text-primary" />
                        </span>
                        <span className="text-[11.5px] font-semibold text-primary">
                            Rewriting for 4 channels
                        </span>
                    </div>
                </div>

                {/* Platform cards */}
                {FANOUT.cards.map((card, i) => {
                    const ch = channelById(card.id)!;

                    return (
                        <div
                            key={card.id}
                            className="absolute rounded-xl border border-border bg-card px-[15px] py-[13px] shadow-lg"
                            style={{
                                top: cardYs[i],
                                right: offsets[i],
                                width: 268,
                            }}
                        >
                            <div className="mb-[7px] flex items-center gap-2">
                                <ChannelPip channel={ch} size={20} />
                                <span className="text-[12.5px] font-semibold text-foreground">
                                    {ch.name}
                                </span>
                                <span className="ml-auto font-dm-mono text-[9px] font-medium tracking-[0.1em] text-primary uppercase">
                                    native
                                </span>
                            </div>
                            <p className="line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">
                                {card.text}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav({
    primaryCta,
    ctaLabel,
    authed,
}: {
    primaryCta: string;
    ctaLabel: string;
    authed: boolean;
}) {
    const scrolled = useScrolled();
    const links = [
        { label: 'How it works', href: '#how-it-works' },
        { label: 'Channels', href: '#channels' },
        { label: 'Pricing', href: '#pricing' },
    ];

    return (
        <header
            className={cn(
                'fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300',
                scrolled
                    ? 'border-border bg-background/85 backdrop-blur-lg'
                    : 'border-transparent bg-transparent',
            )}
        >
            <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4 lg:px-8">
                <a href="#top" className="flex items-center gap-2.5">
                    <BrandMark className="size-7 rounded-lg" />
                    <Wordmark />
                </a>

                <nav className="ml-7 hidden shrink-0 gap-1 lg:flex">
                    {links.map((l) => (
                        <a
                            key={l.href}
                            href={l.href}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {l.label}
                        </a>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-2">
                    {authed ? (
                        <Button asChild size="sm" className="rounded-lg">
                            <Link href={dashboard()}>Dashboard</Link>
                        </Button>
                    ) : (
                        <>
                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="hidden rounded-lg sm:inline-flex"
                            >
                                <Link href={login()}>Sign in</Link>
                            </Button>
                            <Button
                                asChild
                                size="sm"
                                className="rounded-lg font-semibold"
                            >
                                <Link href={primaryCta}>{ctaLabel}</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}

// ── Hero ───────────────────────────────────────────────────────────────────────
function TrustRow() {
    const avatars = ['#E4405F', '#0A66C2', '#1877F2', '#D89A2B'];

    return (
        <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="flex">
                {avatars.map((c, i) => (
                    <span
                        key={i}
                        className="size-7 rounded-full border-2 border-background"
                        style={{ background: c, marginLeft: i === 0 ? 0 : -9 }}
                    />
                ))}
            </div>
            <span className="text-sm leading-snug text-muted-foreground">
                <strong className="font-semibold text-foreground">
                    3,400+ creators
                </strong>{' '}
                post once, land everywhere
            </span>
        </div>
    );
}

function Hero({
    primaryCta,
    ctaLabel,
}: {
    primaryCta: string;
    ctaLabel: string;
}) {
    return (
        <section
            id="top"
            className="relative overflow-hidden bg-background pt-36 pb-24"
        >
            {/* Soft background washes */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden"
            >
                <div className="absolute -top-40 -right-32 size-[560px] rounded-full bg-[radial-gradient(circle,var(--primary)_0%,transparent_68%)] opacity-[0.15]" />
                <div className="absolute -bottom-52 -left-36 size-[520px] rounded-full bg-[radial-gradient(circle,var(--foreground)_0%,transparent_70%)] opacity-[0.04]" />
            </div>

            <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:px-8">
                <div>
                    <Reveal delay={60}>
                        <h1 className="font-brand text-[clamp(2.5rem,6vw,4.75rem)] leading-[1.02] font-semibold tracking-tight text-balance text-foreground">
                            Post once.{' '}
                            <span className="text-primary">
                                Land everywhere.
                            </span>
                        </h1>
                    </Reveal>
                    <Reveal
                        delay={120}
                        className="mt-6 max-w-lg text-[18px] leading-relaxed text-muted-foreground"
                    >
                        Write your post once. TruePost rewrites it into a
                        native-feeling version for every channel you've
                        connected — then schedules them all. No more copy-paste
                        tax.
                    </Reveal>
                    <Reveal
                        delay={180}
                        className="mt-8 flex flex-wrap items-center gap-3"
                    >
                        <Button
                            asChild
                            size="lg"
                            className="h-12 rounded-xl px-7 text-base font-semibold"
                        >
                            <Link href={primaryCta}>{ctaLabel} →</Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="h-12 rounded-xl px-6 text-base font-semibold"
                        >
                            <a href="#how-it-works">See how it works</a>
                        </Button>
                    </Reveal>
                    <Reveal delay={220}>
                        <TrustRow />
                    </Reveal>
                </div>

                <Reveal delay={120} className="min-w-0">
                    <HeroFanout />
                </Reveal>
            </div>
        </section>
    );
}

// ── Channels ───────────────────────────────────────────────────────────────────
function ChannelsSection() {
    return (
        <section
            id="channels"
            className="border-t border-border bg-background py-26"
        >
            <div className="mx-auto max-w-6xl px-6 lg:px-8">
                <SectionHead
                    kicker="Connected accounts"
                    title="Connect your channels."
                    accent="We speak each one natively."
                    sub="Hook up the platforms you actually use. TruePost speaks each one natively — so every post lands like it was written there."
                />

                <div className="mt-12 flex flex-wrap items-center gap-9">
                    {CHANNELS.map((c, i) => (
                        <Reveal
                            key={c.id}
                            delay={i * 50}
                            className="flex flex-col items-center gap-2.5"
                        >
                            <ChannelPip channel={c} size={64} />
                            <span className="text-sm font-medium text-muted-foreground">
                                {c.name}
                            </span>
                        </Reveal>
                    ))}
                </div>

                <Reveal className="mt-7 flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Sparkle className="size-3.5 text-primary" />
                    More channels arriving — Bluesky, Mastodon, Pinterest &amp;
                    TikTok next.
                </Reveal>
            </div>
        </section>
    );
}

// ── How it works ────────────────────────────────────────────────────────────────
const STEPS = [
    {
        n: '01',
        title: 'Write it once',
        body: 'Drop your idea into one composer — a thought, a link, a launch. No formatting, no per-platform tabs. Just the message.',
    },
    {
        n: '02',
        title: 'We rewrite per channel',
        body: 'TruePost adapts your draft to each connected channel — trimming for X, expanding for LinkedIn, adding tags for Instagram. Edit any version, or keep it shared.',
    },
    {
        n: '03',
        title: 'Schedule & land everywhere',
        body: 'Pick a time — or let TruePost spread them across the week. Hit go once and every channel publishes natively, on schedule.',
    },
];

function HowItWorks() {
    return (
        <section id="how-it-works" className="bg-muted/50 py-26">
            <div className="mx-auto max-w-6xl px-6 lg:px-8">
                <SectionHead
                    center
                    kicker="How it works"
                    title="From one draft to every feed —"
                    accent="in three moves."
                />
                <div className="mt-14 grid gap-6 md:grid-cols-3">
                    {STEPS.map((s, i) => (
                        <Reveal key={s.n} delay={i * 90} className="relative">
                            <div className="relative h-full rounded-2xl border border-border bg-background p-8">
                                <div className="mb-4 text-[44px] leading-none text-primary">
                                    {s.n}
                                </div>
                                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                                    {s.title}
                                </h3>
                                <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">
                                    {s.body}
                                </p>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className="absolute top-1/2 -right-4 z-10 hidden text-primary md:block">
                                    <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M3 8h10M9 4l4 4-4 4" />
                                    </svg>
                                </div>
                            )}
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── Pricing ─────────────────────────────────────────────────────────────────────
type Plan = {
    id: string;
    name: string;
    price: string;
    cadence: string;
    blurb: string;
    features: string[];
    cta: string;
    featured: boolean;
};

const PLANS: Plan[] = [
    {
        id: 'solo',
        name: 'Solo',
        price: '$0',
        cadence: 'free forever',
        blurb: 'For getting your first posts out the door.',
        features: [
            '3 connected channels',
            '10 scheduled posts / month',
            'Per-channel AI rewrites',
            'Basic calendar',
        ],
        cta: 'Start free',
        featured: false,
    },
    {
        id: 'creator',
        name: 'Creator',
        price: '$18',
        cadence: 'per month',
        blurb: 'For creators posting everywhere, every day.',
        features: [
            'Unlimited channels',
            'Unlimited scheduled posts',
            'Advanced AI rewrite controls',
            'Best-time scheduling',
            'Drafts & content library',
        ],
        cta: 'Start free trial',
        featured: true,
    },
    {
        id: 'studio',
        name: 'Studio',
        price: '$48',
        cadence: 'per month',
        blurb: 'For small teams & multi-brand creators.',
        features: [
            'Everything in Creator',
            '5 brand workspaces',
            'Team roles & approvals',
            'Analytics & export',
            'Priority support',
        ],
        cta: 'Start free trial',
        featured: false,
    },
];

function Check({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="none"
            className={cn('mt-0.5 size-4 shrink-0', className)}
            aria-hidden
        >
            <circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.16" />
            <path
                d="M4.8 8.2l2 2 4-4.4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function Pricing({ primaryCta }: { primaryCta: string }) {
    return (
        <section
            id="pricing"
            className="border-t border-border bg-background py-26"
        >
            <div className="mx-auto max-w-6xl px-6 lg:px-8">
                <SectionHead
                    center
                    kicker="Pricing"
                    title="Start free."
                    accent="Upgrade when you outgrow it."
                    sub="Every plan includes per-channel AI rewrites. No credit card to start, cancel anytime."
                />
                <div className="mt-14 grid items-stretch gap-5 md:grid-cols-3">
                    {PLANS.map((p, i) => (
                        <Reveal
                            key={p.id}
                            delay={i * 80}
                            className={cn(
                                'flex',
                                p.featured && 'md:-translate-y-2',
                            )}
                        >
                            <div
                                className={cn(
                                    'relative flex w-full flex-col rounded-3xl border p-8',
                                    p.featured
                                        ? 'border-foreground bg-foreground text-background shadow-2xl'
                                        : 'border-border bg-background',
                                )}
                            >
                                {p.featured && (
                                    <span className="absolute top-5 right-5 rounded-full bg-primary px-2.5 py-1 font-dm-mono text-[9.5px] font-semibold tracking-[0.12em] text-primary-foreground uppercase">
                                        Most popular
                                    </span>
                                )}
                                <div className="text-[15px] font-semibold text-primary">
                                    {p.name}
                                </div>
                                <div className="mt-3.5 flex items-baseline gap-2">
                                    <span className="text-[46px] font-bold tracking-tight">
                                        {p.price}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-[13.5px]',
                                            p.featured
                                                ? 'text-background/60'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {p.cadence}
                                    </span>
                                </div>
                                <p
                                    className={cn(
                                        'mt-3 min-h-10 text-sm leading-normal',
                                        p.featured
                                            ? 'text-background/75'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {p.blurb}
                                </p>

                                <Button
                                    asChild
                                    className={cn(
                                        'mt-5 h-11 rounded-xl font-semibold',
                                        !p.featured &&
                                        'bg-background text-foreground',
                                    )}
                                    variant={p.featured ? 'default' : 'outline'}
                                >
                                    <Link href={primaryCta}>{p.cta}</Link>
                                </Button>

                                <div
                                    className={cn(
                                        'my-6 h-px',
                                        p.featured
                                            ? 'bg-background/15'
                                            : 'bg-border',
                                    )}
                                />

                                <ul className="flex flex-col gap-3">
                                    {p.features.map((f) => (
                                        <li
                                            key={f}
                                            className="flex gap-2.5 text-sm leading-snug"
                                        >
                                            <Check className="text-primary" />
                                            <span
                                                className={
                                                    p.featured
                                                        ? 'text-background/90'
                                                        : 'text-foreground/80'
                                                }
                                            >
                                                {f}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────
function FinalCta({
    primaryCta,
    ctaLabel,
}: {
    primaryCta: string;
    ctaLabel: string;
}) {
    return (
        <section id="cta" className="bg-muted/50 py-26">
            <div className="mx-auto max-w-4xl px-6 lg:px-8">
                <Reveal className="relative overflow-hidden rounded-[28px] border border-transparent bg-[#0E1411] px-8 py-16 text-center sm:px-14 dark:border-border dark:bg-card">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -top-36 left-1/2 h-[360px] w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--primary)_0%,transparent_70%)] opacity-[0.2]"
                    />
                    <div className="relative">
                        <div className="mb-5 flex justify-center">
                            <BrandMark className="size-10 rounded-xl" />
                        </div>
                        <h2 className="font-brand text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.06] font-semibold tracking-tight text-balance text-[#FBFAF6] dark:text-foreground">
                            Stop reformatting.{' '}
                            <span className="text-primary">Start posting.</span>
                        </h2>
                        <p className="mx-auto mt-4.5 max-w-md text-[17px] leading-relaxed text-[#FBFAF6]/70 dark:text-muted-foreground">
                            Connect your channels, write your first post, and
                            watch it land everywhere — in the next five minutes.
                        </p>
                        <div className="mt-8 flex justify-center">
                            <Button
                                asChild
                                size="lg"
                                className="h-12 rounded-xl px-8 text-base font-semibold"
                            >
                                <Link href={primaryCta}>{ctaLabel} →</Link>
                            </Button>
                        </div>
                        <div className="mt-5 text-[13px] text-[#FBFAF6]/55 dark:text-muted-foreground">
                            Free forever plan · No credit card · Cancel anytime
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

// ── Footer ──────────────────────────────────────────────────────────────────────
const FOOTER_COLS = [
    {
        h: 'Product',
        links: ['Channels', 'How it works', 'Pricing', "What's new"],
    },
    { h: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
    { h: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
];

function Footer() {
    return (
        <footer className="border-t border-border bg-background pt-14 pb-10">
            <div className="mx-auto max-w-6xl px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-[1.4fr_repeat(3,1fr)]">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2.5">
                            <BrandMark className="size-6 rounded-md" />
                            <Wordmark />
                        </div>
                        <p className="mt-3.5 max-w-60 text-[13.5px] leading-relaxed text-muted-foreground">
                            Post once. Land everywhere. The composer for
                            creators who are tired of the copy-paste tax.
                        </p>
                    </div>
                    {FOOTER_COLS.map((col) => (
                        <div key={col.h}>
                            <div className="mb-3.5 text-xs font-semibold tracking-[0.08em] text-muted-foreground/70 uppercase">
                                {col.h}
                            </div>
                            <ul className="flex flex-col gap-2.5">
                                {col.links.map((l) => (
                                    <li key={l}>
                                        <a
                                            href="#"
                                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            {l}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="mt-11 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5.5">
                    <span className="text-[13px] text-muted-foreground/70">
                        © 2026 TruePost. All rights reserved.
                    </span>
                    <span className="font-dm-mono text-[11px] tracking-[0.1em] text-muted-foreground/70 uppercase">
                        Made for people who post everywhere
                    </span>
                </div>
            </div>
        </footer>
    );
}

// ── Page ────────────────────────────────────────────────────────────────────────
export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props;
    useReveal();

    const ctaLabel = 'Start free';
    const primaryCta: string = auth.user
        ? (dashboard().url as string)
        : canRegister
            ? (register().url as string)
            : (login().url as string);

    return (
        <>
            <Head title="TruePost — Post once. Land everywhere." />
            <div className="min-h-screen bg-background font-brand text-foreground antialiased">
                <Nav
                    primaryCta={primaryCta}
                    ctaLabel={ctaLabel}
                    authed={!!auth.user}
                />
                <main>
                    <Hero primaryCta={primaryCta} ctaLabel={ctaLabel} />
                    <ChannelsSection />
                    <HowItWorks />
                    <Pricing primaryCta={primaryCta} />
                    <FinalCta primaryCta={primaryCta} ctaLabel={ctaLabel} />
                </main>
                <Footer />
            </div>
        </>
    );
}
