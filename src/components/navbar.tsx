"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAccount } from "wagmi";
import { isAllowedAdminAddress } from "@/lib/admin-auth";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Events", href: "#events" },
  { label: "Partners", href: "#partners" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { address } = useAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = mounted && isAllowedAdminAddress(address);

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-transparent py-4 text-foreground">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <img
            src="/logo/web3uoa_logo.png"
            alt="WEB3UOA"
            className="w-10 h-10 transition-transform duration-500 group-hover:scale-110 drop-shadow-sm"
          />
          <span className="text-xl font-black tracking-tight">WEB3UOA</span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-bold tracking-wide transition-all text-foreground/80 hover:text-primary"
            >
              {link.label}
            </a>
          ))}
          {isAdmin && (
            <a
              href="/admin"
              className="text-sm font-bold tracking-wide transition-colors text-yellow-500 hover:text-yellow-400"
            >
              Admin Panel
            </a>
          )}
          <Button
            size="sm"
            className="rounded-xl px-6 py-5 font-bold shadow-md hover:shadow-lg transition-transform hover:-translate-y-0.5"
            asChild
          >
            <a
              href="https://forms.gle/vzRb7t46SPBUwi7v8"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join Us
            </a>
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-foreground transition-colors hover:bg-secondary"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/98 backdrop-blur-xl border-b border-border shadow-lg">
          <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-base font-bold py-2 transition-colors border-b border-border/50 text-foreground/80 hover:text-primary"
              >
                {link.label}
              </a>
            ))}
            {isAdmin && (
              <a
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="text-base font-bold text-yellow-500 hover:text-yellow-400 py-2 transition-colors border-b border-border/50"
              >
                Admin Panel
              </a>
            )}
            <div className="flex justify-center py-2">
              <appkit-button balance="hide" />
            </div>
            <Button
              size="lg"
              className="rounded-xl font-bold mt-4 w-full h-12"
              asChild
            >
              <a
                href="https://forms.gle/vzRb7t46SPBUwi7v8"
                target="_blank"
                rel="noopener noreferrer"
              >
                Join Us
              </a>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
