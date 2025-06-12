
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { MainLayout } from '@/components/layout/main-layout';
import { AuthProvider } from '@/contexts/AuthContext';


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
  console.log("--- RootLayout component rendering ---");
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        {/* TEMP DIAGNOSTIC TEXT FROM LAYOUT */}
        <div style={{ position: 'absolute', top: 0, left: 0, background: 'yellow', color: 'black', padding: '5px', zIndex: 9999 }}>TEMP DIAGNOSTIC TEXT FROM LAYOUT</div>
        <AuthProvider>
          <MainLayout>{children}</MainLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
