
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  ShieldCheck,
  BookText,
  Activity,
  ShieldAlert,
  ShieldX, 
  ServerCog, 
  ScrollText,
  Settings,
  ClipboardCheck, // Ensure ClipboardCheck is imported
  LucideIcon,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  bottom?: boolean; // Optional flag for items at the bottom
}

const mainNavItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/phishing-analyzer', label: 'Phishing Analyzer', icon: ShieldCheck },
  { href: '/knowledge-base', label: 'Knowledge Base', icon: BookText },
  { href: '/malware-detector', label: 'Malware Detector', icon: ShieldX },
  { href: '/system-analyzer', label: 'System Analyzer', icon: ServerCog },
  { href: '/report-summarizer', label: 'Report Summarizer', icon: ScrollText },
  { href: '/originality-checker', label: 'Originality Checker', icon: ClipboardCheck }, // Added item
  { href: '/predictive-sentinel', label: 'Predictive Sentinel', icon: Activity },
  { href: '/autonomous-responder', label: 'Autonomous Responder', icon: ShieldAlert },
];

const utilityNavItems: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Settings, bottom: true },
];

export function SidebarNav() {
  const pathname = usePathname();

  const renderNavItem = (item: NavItem) => (
    <SidebarMenuItem key={item.href}>
      <Link href={item.href} passHref legacyBehavior>
        <SidebarMenuButton
          asChild
          isActive={pathname === item.href}
          className={cn(
            'justify-start',
            pathname === item.href
              ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90'
              : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
          tooltip={item.label}
        >
          <a>
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </a>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );

  return (
    <div className="flex flex-col h-full">
      <SidebarMenu className="flex-grow">
        {mainNavItems.map(renderNavItem)}
      </SidebarMenu>
      <SidebarMenu className="mt-auto border-t border-sidebar-border pt-2">
        {utilityNavItems.map(renderNavItem)}
      </SidebarMenu>
    </div>
  );
}

