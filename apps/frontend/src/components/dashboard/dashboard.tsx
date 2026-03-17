"use client";

import { useIsMobile } from "@/hooks/use-is-mobile";
import React, { useState, useEffect } from "react";
import { TopBar } from "./top-bar";
import { navItems, Sidebar } from "./sidebar";
import { useDarkMode } from "@/providers/dark-mode-provider";

export default function EnergyDashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [activeRoute, setActiveRoute] = useState("/dashboard");
  const { darkMode, toggle } = useDarkMode();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const routeTitle =
    navItems.find((n) => n.href === activeRoute)?.label ?? "Dashboard";

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-800 dark:text-white overflow-hidden transition-colors duration-200">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        isMobile={isMobile}
        activeRoute={activeRoute}
        onNavigate={setActiveRoute}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          isMobile={isMobile}
          title={routeTitle}
          darkMode={darkMode}
          onToggleTheme={toggle}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">{children}</main>
      </div>
    </div>
  );
}
