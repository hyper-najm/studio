'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { UserCircle, Bell, Globe, Mic, Settings, LogOut, Loader2, LogIn, UserCog } from 'lucide-react'; 
import { usePathname } from 'next/navigation'; 
import Link from 'next/link'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';


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
    case '/report-summarizer':
      return 'Report Summarizer';
    case '/predictive-sentinel':
      return 'Predictive Sentinel';
    case '/autonomous-responder':
      return 'Autonomous Responder';
    case '/settings':
      return 'Settings';
    case '/admin':
      return 'Admin Dashboard';
    case '/login':
      return 'Login / Sign Up'; // Updated title
    default:
      return 'CyberGuardian Pro';
  }
};

export function Header() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const { toast } = useToast();
  const { user, logOut, loading: authLoading } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" /> 
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

        <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => toast({ title: "Notifications", description: "No new notifications."})}>
          <Bell className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="User Profile" disabled={authLoading}>
              {authLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <UserCircle className="h-6 w-6" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {user ? (
              <>
                <DropdownMenuLabel className="truncate">
                  {user.displayName || user.email || "My Account"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <UserCog className="mr-2 h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logOut} disabled={authLoading}>
                  {authLoading && pathname !== '/login' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                  <span>Logout</span>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuLabel>Guest</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    <span>Login / Sign Up</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
