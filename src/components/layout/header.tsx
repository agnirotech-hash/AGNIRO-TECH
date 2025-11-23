
"use client";
import React, { useState, useEffect } from 'react';
import { MountainSnow, Newspaper, Youtube } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggleButton } from '@/components/custom/theme-toggle-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Header() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="flex items-center space-x-2 mr-4">
          <MountainSnow
            suppressHydrationWarning // Added
            className={cn(
              "h-6 w-6 transition-opacity duration-150",
              mounted ? "opacity-100 text-primary" : "opacity-0"
            )}
          />
          <span className="font-bold text-foreground hidden sm:inline">AGNIRO Crop Calendar</span>
        </Link>
        
        <nav className="flex items-center space-x-2 mr-auto">
          <Button variant="ghost" asChild size="sm">
            <Link href="/articles">
              <Newspaper
                suppressHydrationWarning // Added
                className={cn(
                  "mr-2 h-4 w-4 transition-opacity duration-150",
                  mounted ? "opacity-100 text-foreground" : "opacity-0"
                )}
              />
               Articles
            </Link>
          </Button>
          <Button variant="ghost" asChild size="sm">
            <Link href="/videos">
              <Youtube
                suppressHydrationWarning // Added
                className={cn(
                  "mr-2 h-4 w-4 transition-opacity duration-150",
                  mounted ? "opacity-100 text-destructive" : "opacity-0"
                )}
              />
               Videos
            </Link>
          </Button>
        </nav>
        
        <div className="flex items-center space-x-2 ml-auto">
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
}
