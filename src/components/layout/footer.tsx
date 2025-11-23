
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Facebook, Twitter, Linkedin } from "lucide-react";
import Link from "next/link";
import React from "react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card text-card-foreground border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Column 1: About & Contact */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-3">AGNIRO</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Empowering users through innovative solutions.
            </p>
            <ul className="space-y-1 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Column 2: Legal & Social */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-3">Connect</h3>
             <ul className="space-y-1 text-sm mb-4">
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
            <div className="flex space-x-4">
              <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-6 w-6" />
              </Link>
              <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-6 w-6" />
              </Link>
              <Link href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-6 w-6" />
              </Link>
            </div>
          </div>

          {/* Column 3: Newsletter */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-3">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Subscribe to our newsletter for the latest updates.
            </p>
            <form className="flex space-x-2">
              <Input type="email" placeholder="your.email@example.com" className="bg-background flex-1 text-sm" />
              <Button type="submit" variant="default" className="text-sm">Subscribe</Button>
            </form>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} J.ORINGA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
