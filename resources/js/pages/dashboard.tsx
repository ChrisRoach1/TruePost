import { Head, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { Clock, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { CreatePost } from '@/components/create-post'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { store } from '@/routes/userPost';
import type { System, UserToken } from '@/types';




export default function Dashboard({
    connectedAccounts = [],
    systems = [],
}: Props) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="px-4 py-7 text-foreground">
                <CreatePost connectedAccounts={connectedAccounts} systems={systems} />
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
