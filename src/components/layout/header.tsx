
'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { UserCircle, Bell, Globe, Mic } from 'lucide-react';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';


const getPageTitle = (pathname: string): string => {
  switch (pathname) {
    case '/':
      return 'Threat Dashboard';
    case '/phishing-analyzer':
      return 'Advanced Input Analyzer';
    case '/knowledge-base':
      return 'Cybersecurity RAG';
    case '/malware-detector':
      return 'Malware Detector';
    case '/system-analyzer':
      return 'System Analyzer';
    case '/predictive-sentinel':
      return 'Predictive Sentinel';
    case '/autonomous-responder':
      return 'Autonomous Responder';
    default:
      return 'CyberGuardian Pro';
  }
};

export function Header() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const { toast } = useToast();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" /> {/* Hidden on md and larger screens */}
        <h2 className="text-xl font-semibold">{pageTitle}</h2>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Select Language">
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Language</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toast({ title: "Language", description: "Site language set to English."})}>English</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast({ title: "Idioma", description: "Funcionalidad de cambio de idioma próximamente.", variant: "default" })}>Español (Próximamente)</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast({ title: "Langue", description: "Fonctionnalité de changement de langue à venir.", variant: "default" })}>Français (Bientôt disponible)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant="ghost" 
          size="icon" 
          aria-label="Voice Chat" 
          onClick={() => toast({ title: "Voice Assistant", description: "Voice interaction feature coming soon!" })}
        >
          <Mic className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="User Profile">
              <UserCircle className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
