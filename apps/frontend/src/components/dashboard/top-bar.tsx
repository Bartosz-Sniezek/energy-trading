import { useAuth } from "@/providers/auth-provider";
import { Icons } from "./icons";

export interface TopBarProps {
  onMenuClick: () => void;
  isMobile: boolean;
  title: string;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export function TopBar({
  onMenuClick,
  isMobile,
  title,
  darkMode,
  onToggleTheme,
}: TopBarProps) {
  const { logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#0b1120]/80 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-lg text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <Icons.Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-base font-semibold text-slate-800 dark:text-white/90">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg text-slate-400 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            <Icons.Sun className="w-[18px] h-[18px]" />
          ) : (
            <Icons.Moon className="w-[18px] h-[18px]" />
          )}
        </button>
        <button className="relative p-2 rounded-lg text-slate-400 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
          <Icons.Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
        </button>
        <button
          onClick={async () => await logout()}
          className="p-2 rounded-lg text-slate-400 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
        >
          <Icons.LogOut className="w-[18px] h-[18px]" />
        </button>
      </div>
    </header>
  );
}
