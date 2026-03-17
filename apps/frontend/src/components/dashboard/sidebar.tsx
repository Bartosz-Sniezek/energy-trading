import { useState } from "react";
import { IconProps, Icons } from "./icons";
import { useAuth } from "@/providers/auth-provider";

const SIDEBAR_WIDTH = 264;
const SIDEBAR_COLLAPSED_WIDTH = 72;

export interface NavItem {
  label: string;
  icon: React.FC<IconProps>;
  href: string;
  badge?: string;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", icon: Icons.LayoutDashboard, href: "/dashboard" },
  { label: "Trading", icon: Icons.TrendingUp, href: "/trading", badge: "LIVE" },
  { label: "Portfolio", icon: Icons.Wallet, href: "/portfolio" },
  { label: "Analytics", icon: Icons.BarChart, href: "/analytics" },
  { label: "Contracts", icon: Icons.FileText, href: "/contracts", badge: "3" },
  { label: "Settings", icon: Icons.Settings, href: "/settings" },
];

export interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  isMobile: boolean;
  activeRoute: string;
  onNavigate: (href: string) => void;
}

export function Sidebar({
  open,
  onToggle,
  isMobile,
  activeRoute,
  onNavigate,
}: SidebarProps) {
  const width = open ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  if (isMobile) {
    return (
      <>
        {open && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={onToggle}
          />
        )}
        <aside
          className={`
            fixed top-0 left-0 z-50 h-full
            border-r border-white/[0.06]
            flex flex-col
            transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
            ${open ? "translate-x-0" : "-translate-x-full"}
          `}
          style={{ width: SIDEBAR_WIDTH, backgroundColor: "#0a0f1a" }}
        >
          <SidebarContent
            open={true}
            activeRoute={activeRoute}
            onNavigate={(href) => {
              onNavigate(href);
              onToggle();
            }}
            onToggle={onToggle}
            isMobile={isMobile}
          />
        </aside>
      </>
    );
  }

  return (
    <aside
      className="
        h-screen sticky top-0 flex-shrink-0
        border-r border-white/[0.06]
        flex flex-col
        transition-[width] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
        overflow-hidden
      "
      style={{ width, backgroundColor: "#0a0f1a" }}
    >
      <SidebarContent
        open={open}
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        onToggle={onToggle}
        isMobile={isMobile}
      />
    </aside>
  );
}

interface SidebarContentProps {
  open: boolean;
  activeRoute: string;
  onNavigate: (href: string) => void;
  onToggle: () => void;
  isMobile: boolean;
}

const sidebarColors = {
  border: "rgba(255,255,255,0.06)",
  textPrimary: "rgba(255,255,255,0.9)",
  textSecondary: "rgba(255,255,255,0.8)",
  textMuted: "rgba(255,255,255,0.5)",
  textDimmed: "rgba(255,255,255,0.4)",
  hoverText: "rgba(255,255,255,0.8)",
  hoverBg: "rgba(255,255,255,0.04)",
  activeBg: "rgba(16,185,129,0.1)",
  activeText: "#34d399",
  activeIndicator: "#34d399",
  badgeLiveBg: "rgba(16,185,129,0.2)",
  badgeDefaultBg: "rgba(255,255,255,0.08)",
  iconDark: "#0a0f1a",
};

function SidebarContent({
  open,
  activeRoute,
  onNavigate,
  onToggle,
  isMobile,
}: SidebarContentProps) {
  const { user } = useAuth();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      <div
        className="h-16 flex items-center gap-3 px-5 flex-shrink-0"
        style={{ borderBottom: `1px solid ${sidebarColors.border}` }}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
          <Icons.Bolt
            className="w-4 h-4"
            style={{ color: sidebarColors.iconDark }}
          />
        </div>
        {open && (
          <div className="overflow-hidden whitespace-nowrap">
            <span
              className="text-sm font-semibold tracking-wide"
              style={{ color: sidebarColors.textPrimary }}
            >
              VOLTEX
            </span>
            <span
              className="text-[10px] ml-1.5 font-medium tracking-widest"
              style={{ color: sidebarColors.activeText }}
            >
              ENERGY
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeRoute === item.href;
          const isHovered = hoveredItem === item.href;
          return (
            <button
              key={item.href}
              onClick={() => onNavigate(item.href)}
              onMouseEnter={() => setHoveredItem(item.href)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                w-full flex items-center gap-3 rounded-lg text-sm font-medium
                transition-all duration-150 relative
                ${open ? "px-3 py-2.5" : "px-0 py-2.5 justify-center"}
              `}
              style={{
                color: isActive
                  ? sidebarColors.activeText
                  : isHovered
                    ? sidebarColors.hoverText
                    : sidebarColors.textMuted,
                backgroundColor: isActive
                  ? sidebarColors.activeBg
                  : isHovered
                    ? sidebarColors.hoverBg
                    : "transparent",
              }}
              title={!open ? item.label : undefined}
            >
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ backgroundColor: sidebarColors.activeIndicator }}
                />
              )}
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {open && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`ml-auto text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded ${
                        item.badge === "LIVE" ? "animate-pulse" : ""
                      }`}
                      style={{
                        backgroundColor:
                          item.badge === "LIVE"
                            ? sidebarColors.badgeLiveBg
                            : sidebarColors.badgeDefaultBg,
                        color:
                          item.badge === "LIVE"
                            ? sidebarColors.activeText
                            : sidebarColors.textMuted,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div
        className="p-3 flex-shrink-0"
        style={{ borderTop: `1px solid ${sidebarColors.border}` }}
      >
        <div
          className={`flex items-center gap-3 mb-3 ${open ? "px-2" : "justify-center"}`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
            {[user.firstName, user.lastName]
              .filter((val) => !!val)
              .map((val) => val[0].toUpperCase())
              .join("")}
          </div>
          {open && (
            <div className="overflow-hidden">
              <p
                className="text-xs font-medium truncate"
                style={{ color: sidebarColors.textSecondary }}
              >
                {[user.firstName, user.lastName]
                  .filter((val) => !!val)
                  .join(" ")}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors text-xs"
          style={{ color: sidebarColors.textDimmed }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = sidebarColors.hoverText;
            e.currentTarget.style.backgroundColor = sidebarColors.hoverBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = sidebarColors.textDimmed;
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          {isMobile ? (
            <>
              <Icons.X className="w-4 h-4" />
              {open && <span>Close</span>}
            </>
          ) : open ? (
            <>
              <Icons.ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          ) : (
            <Icons.ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
