import { Link } from '@inertiajs/react';
import { LayoutGrid, Settings, User } from 'lucide-react';
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
import { accounts, dashboard } from '@/routes';
import { edit } from '@/routes/profile';
import userPost from '@/routes/userPost';
import type { NavItem } from '@/types';

const createNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    }
];

const postNavItems: NavItem[] = [
    {
        title: 'Posts',
        href: userPost.index(),
        icon: LayoutGrid,
    }
];

const configNavItems: NavItem[] = [
    {
        title: 'Connected Accounts',
        href: accounts(),
        icon: User,
    },
    {
        title: 'Settings',
        href: edit(),
        icon: Settings,
    },
];


export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
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
