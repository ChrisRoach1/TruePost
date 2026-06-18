import type { Auth } from '@/types/auth';
import type { FacebookPages } from '@/types/system';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            pagesToSelect: FacebookPages[];
            [key: string]: unknown;
        };
    }
}
