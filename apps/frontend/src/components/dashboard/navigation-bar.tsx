"use client";

import { useAuth } from "@/providers/auth-provider";
import { ChevronRight, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { label: "Home", href: "#" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
  { label: "Blog", href: "#blog" },
];

function Logo({ className = "", compact = false }) {
  return (
    <a href="#" className={`flex items-center gap-2 shrink-0 ${className}`}>
      <span className="inline-flex items-center justify-center rounded-md px-0.5 dark:bg-white/10 dark:backdrop-blur-sm transition-colors">
        <img src="/images/logo.svg" alt="Logo" className="h-12 w-auto" />
      </span>
      {!compact && (
        <span className="font-semibold tracking-tight text-foreground text-sm">
          Energy Trading
        </span>
      )}
    </a>
  );
}

export const NavigationBar = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />

          <ul className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <button
              className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-semibold hover:ring-2 hover:ring-ring transition"
              title="Account"
            >
              {[user.firstName, user.lastName]
                .filter((val) => !!val)
                .map((val) => val[0].toUpperCase())
                .join("")}
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <button className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Log in
              </button>
              <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
                Sign up
              </button>
            </div>

            <button
              onClick={() => setOpen(true)}
              className="inline-flex md:hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      <div
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-background border-l border-border shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-border">
          <Logo compact />
          <button
            onClick={() => setOpen(false)}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col py-2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {link.label}
              <ChevronRight className="h-4 w-4 opacity-40" />
            </a>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-semibold">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                John Doe
              </p>
              <p className="text-xs text-muted-foreground truncate">
                john@example.com
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setOpen(false);
            }}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            Sign up
          </button>
          <button
            onClick={() => {
              setOpen(false);
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Log in
          </button>
        </div>
      </div>
    </>
  );
};
