import { Link, usePage } from '@inertiajs/react';
import { BotIcon, LayoutGrid, PencilIcon, Settings, User } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { accounts, create } from '@/routes';
import bots from '@/routes/bots';
import { bot } from '@/routes/create';
import { edit } from '@/routes/profile';
import userPost from '@/routes/userPost';
import type { NavItem } from '@/types';


export function AppSidebar() {
    const { auth } = usePage().props;

    const createNavItems: NavItem[] = [
        {
            title: 'Post',
            href: create(),
            icon: PencilIcon,
            shouldShow: true
        },
        {
            title: 'Bot',
            href: bot(),
            icon: BotIcon,
            shouldShow: true
        }
    ];

    const postNavItems: NavItem[] = [
        {
            title: 'Posts',
            href: userPost.index(),
            icon: LayoutGrid,
            shouldShow: true
        },
        {
            title: 'Bots',
            href: bots.list(),
            icon: BotIcon,
            shouldShow: true
        }
    ];

    const configNavItems: NavItem[] = [
        {
            title: 'Connected Accounts',
            href: accounts(),
            icon: User,
            shouldShow: true
        },
        {
            title: 'Settings',
            href: edit(),
            icon: Settings,
            shouldShow: true
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={create()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain createItems={createNavItems} postNavItems={postNavItems} configNavItems={configNavItems}/>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
