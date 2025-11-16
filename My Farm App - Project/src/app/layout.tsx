
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer'; // Import Footer
import { CropDataProvider } from '@/context/crop-data-context';
import { ThemeProvider } from '@/context/theme-provider';


export const metadata: Metadata = {
  title: 'AGNIRO Crop Calendar',
  description: 'Interactive crop calendar and AI planting advisor for Uganda',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background font-sans text-foreground flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <CropDataProvider>
            <div className="flex flex-col flex-1"> {/* Wrapper to make footer sticky */}
              <Header />
              <main className="flex-1"> {/* This main will take up the remaining space */}
                {children}
              </main>
              <Toaster />
              <Footer /> {/* Add Footer here */}
            </div>
          </CropDataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
