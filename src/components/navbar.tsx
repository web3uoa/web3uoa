"use client";
import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useAccount } from "wagmi";
import { isAllowedAdminAddress } from "@/lib/admin-auth";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { label: "About", href: "#about" },
  { label: "Events", href: "#events" },
  { label: "Partners", href: "#partners" },
];

const JOIN_URL = "https://forms.gle/vzRb7t46SPBUwi7v8";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { address } = useAccount();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = mounted && isAllowedAdminAddress(address);

  return (
    <nav className="sticky top-0 z-20 border-b border-border bg-nav backdrop-blur-[14px]">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-5 px-7 py-3.5">
        {/* Logo */}
        <a
          href="#top"
          className="flex items-center gap-2.5 font-bold tracking-[0.02em] text-foreground"
        >
          <img
            src="/logo/web3uoa_logo.png"
            alt="WEB3UOA"
            className="h-[30px] w-[30px] object-contain"
          />
          <span>WEB3UOA</span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-[26px] text-sm md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-subtle transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          {isAdmin && (
            <a
              href="/admin"
              className="text-amber-600 transition-colors hover:text-amber-500 dark:text-yellow-500 dark:hover:text-yellow-400"
            >
              Admin Panel
            </a>
          )}
          <ThemeToggle />
          <a
            href={JOIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-foreground px-[18px] py-[9px] font-semibold text-background transition-colors hover:bg-primary"
          >
            Join Us
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-foreground transition-colors hover:bg-foreground/10"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute left-0 right-0 top-full border-b border-border bg-background/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-7 py-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="border-b border-border py-2 text-base text-subtle transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            {isAdmin && (
              <a
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="border-b border-border py-2 text-base text-amber-600 transition-colors hover:text-amber-500 dark:text-yellow-500 dark:hover:text-yellow-400"
              >
                Admin Panel
              </a>
            )}
            <div className="flex justify-center py-2">
              <appkit-button balance="hide" />
            </div>
            <a
              href={JOIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 rounded-full bg-foreground py-3 text-center font-semibold text-background"
            >
              Join Us
            </a>
          </div>
        </div>
      )}

      {/* Scroll progress */}
      <div className="absolute inset-x-0 -bottom-px h-0.5">
        <div
          data-prog="1"
          className="h-full origin-left scale-x-0 bg-gradient-to-r from-primary to-violet"
        />
      </div>
    </nav>
  );
}
