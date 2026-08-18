import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import type { System } from '@/types/system';

/**
 * Brands whose stored colors are plain black and white. They live here instead
 * of the systems table because neither value is correct on its own: the swap
 * can only happen in the browser, where the active theme is known.
 */
const MONOCHROME_ICONS = new Set(['FaXTwitter', 'FaThreads']);

type SystemColors = Pick<System, 'icon' | 'background_color' | 'icon_color'>;

type SystemStyle = {
    className: string;
    style?: CSSProperties;
};

function isMonochromeSystem(system: Pick<System, 'icon'>): boolean {
    return MONOCHROME_ICONS.has(system.icon);
}

/** A solid brand-colored tile with the icon knocked out of it. */
export function systemTileStyle(
    system: SystemColors,
    className?: string,
): SystemStyle {
    if (isMonochromeSystem(system)) {
        return { className: cn(className, 'bg-foreground text-background') };
    }

    return {
        className: cn(className, 'text-white'),
        style: { backgroundColor: system.background_color },
    };
}

/** A bare icon tinted with the brand color. */
export function systemAccentStyle(
    system: SystemColors,
    className?: string,
): SystemStyle {
    if (isMonochromeSystem(system)) {
        return { className: cn(className, 'text-foreground') };
    }

    return {
        className: cn(className),
        style: { color: system.icon_color },
    };
}
