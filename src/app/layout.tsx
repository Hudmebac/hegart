import type { Metadata } from 'next';
import { montserrat } from '@/lib/fonts';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: '#HegArt - Symmetric Art Generator', 
  icons: {
    icon: "https://heggie.netlify.app/favicon.ico"
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
      <body className={`${montserrat.variable} font-montserrat antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <footer className="flex justify-center items-center p-4 w-full">
            <p className="mr-4">#HegArt © 2025 Craig Heggie. All rights reserved.</p>
            <a href="https://heggie.netlify.app/" target="_blank" rel="noopener noreferrer">
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                HeggieHub
              </button>
            </a>
          </footer>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
