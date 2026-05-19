const FALLBACK_TIMEZONES = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'America/Toronto',
    'America/Vancouver',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'America/Argentina/Buenos_Aires',
    'Europe/London',
    'Europe/Dublin',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Rome',
    'Europe/Amsterdam',
    'Europe/Stockholm',
    'Europe/Athens',
    'Europe/Moscow',
    'Africa/Cairo',
    'Africa/Johannesburg',
    'Asia/Dubai',
    'Asia/Karachi',
    'Asia/Kolkata',
    'Asia/Bangkok',
    'Asia/Singapore',
    'Asia/Hong_Kong',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Australia/Perth',
    'Australia/Sydney',
    'Pacific/Auckland',
];

export function getTimezones(): string[] {
    if (
        typeof Intl !== 'undefined' &&
        typeof (
            Intl as unknown as {
                supportedValuesOf?: (key: string) => string[];
            }
        ).supportedValuesOf === 'function'
    ) {
        try {
            return (
                Intl as unknown as {
                    supportedValuesOf: (key: string) => string[];
                }
            ).supportedValuesOf('timeZone');
        } catch {
            return FALLBACK_TIMEZONES;
        }
    }

    return FALLBACK_TIMEZONES;
}

export function getBrowserTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
        return 'UTC';
    }
}
