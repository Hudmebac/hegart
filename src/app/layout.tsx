
import type { Metadata } from 'next';
import { montserrat } from '@/lib/fonts';
import './globals.css';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button"; // Keep for footer if needed, or remove if not.
import Link from 'next/link'; // Keep for footer if needed, or remove if not.


export const metadata: Metadata = {
  title: '#HegArt - Symmetric Art Generator',
  icons: {
    icon: "/favicon.png"
 },
  description: 'Create beautiful symmetric and animated art.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${montserrat.variable} font-montserrat antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Header removed from here, AppClient.tsx will manage its own header */}
          {children}
          <footer className="flex flex-col sm:flex-row justify-center items-center p-4 w-full text-center sm:text-left text-sm text-muted-foreground gap-2 sm:gap-4 border-t">
            <div className="flex items-center gap-4">
              <p>#HegArt © 2025 Craig Heggie. All rights reserved.</p>
              <a href="https://heggie.netlify.app/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                <Button variant="outline" size="sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://heggie.netlify.app/favicon.ico" alt="HeggieHub Favicon" className="h-4 w-4 mr-2" />
                  HeggieHub
                </Button>
              </a>
            </div>
          </footer>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

