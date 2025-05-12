import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarTrigger, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { Toaster } from "@/components/ui/toaster";
import { ShieldHalf } from 'lucide-react';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CyberGuardian Pro',
  description: 'Enhanced Cybersecurity & Threat Intelligence Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SidebarProvider defaultOpen>
          <Sidebar className="border-r border-sidebar-border">
            <SidebarHeader className="p-4">
              <div className="flex items-center gap-2">
                <ShieldHalf className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-semibold text-primary">CyberGuardian Pro</h1>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarNav />
            </SidebarContent>
            <SidebarFooter className="p-2">
              {/* Optional: Add footer content like version or logout */}
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <Header />
            <main className="flex-1 p-6 overflow-auto">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
