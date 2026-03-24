import { useDarkMode } from "@/providers/dark-mode-provider";
import { useState, useEffect, useRef, type FC } from "react";
import { EnrichedTick, usePriceFeed } from "./use-price-feed";

interface DashboardProps {
  url?: string;
  instruments: string[];
  token?: string;
}

// ─── Formatters ─────────────────────────────────────

const fmt = (n: number | null | undefined, d = 2): string =>
  n == null
    ? "—"
    : Number(n).toLocaleString(undefined, {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      });

const fmtPct = (n: number | null | undefined): string =>
  n == null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

const fmtVol = (n: number | null | undefined): string => {
  if (n == null) return "—";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return fmt(n, 0);
};

const decimals = (price: number): number => (price < 1 ? 6 : 2);

// ─── Sparkline ──────────────────────────────────────

function useSpark(price: number | undefined): number[] {
  const ref = useRef<number[]>([]);
  if (price != null) {
    ref.current = [...ref.current.slice(-59), price];
  }
  return ref.current;
}

const Sparkline: FC<{ data: number[]; up: boolean }> = ({ data, up }) => {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 32;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <polyline
        points={points}
        fill="none"
        stroke={up ? "#00e676" : "#ff5252"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ─── Tick Row ───────────────────────────────────────

const TickRow: FC<{ tick: EnrichedTick; dark: boolean }> = ({ tick, dark }) => {
  const spark = useSpark(tick.price);
  const isUp = tick.change >= 0;
  const flash =
    tick._flash && Date.now() - tick._flashTs < 600 ? tick._flash : null;

  const d = decimals(tick.price);
  const color = isUp ? "text-emerald-500" : "text-red-500";
  const border = dark ? "border-slate-700/60" : "border-slate-200";
  const muted = dark ? "text-slate-400" : "text-slate-500";

  return (
    <tr
      className={`
        transition-colors duration-300
        ${dark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50"}
        ${flash === "up" ? "bg-emerald-500/[0.07]" : ""}
        ${flash === "down" ? "bg-red-500/[0.07]" : ""}
      `}
    >
      <td className={`min-w-[160px] px-3.5 py-3 border-b ${border}`}>
        <span
          className={`block font-bold text-sm ${dark ? "text-white" : "text-slate-900"}`}
        >
          {tick.symbol}
        </span>
        <span className={`block text-xs mt-0.5 ${muted}`}>{tick.name}</span>
      </td>

      <td className={`px-3.5 py-3 border-b ${border} font-mono ${color}`}>
        {fmt(tick.price, d)}
        <span className={`text-xs ml-1 ${muted}`}>{tick.unit}</span>
      </td>

      <td className={`px-3.5 py-3 border-b ${border} font-mono ${color}`}>
        <span className="text-xs mr-0.5">{isUp ? "▲" : "▼"}</span>
        {fmt(Math.abs(tick.change), d)}
      </td>

      <td className={`px-3.5 py-3 border-b ${border} font-mono ${color}`}>
        {fmtPct(tick.changePct)}
      </td>

      <td className={`px-3.5 py-3 border-b ${border} hidden lg:table-cell`}>
        <Sparkline data={spark} up={isUp} />
      </td>

      <td
        className={`px-3.5 py-3 border-b ${border} font-mono ${muted} hidden lg:table-cell`}
      >
        {fmt(tick.bid, d)}
      </td>

      <td
        className={`px-3.5 py-3 border-b ${border} font-mono ${muted} hidden lg:table-cell`}
      >
        {fmt(tick.ask, d)}
      </td>

      <td
        className={`px-3.5 py-3 border-b ${border} font-mono ${muted} hidden lg:table-cell`}
      >
        {fmt(tick.spread, tick.price < 1 ? 6 : 4)}
      </td>

      <td className={`px-3.5 py-3 border-b ${border} font-mono ${muted}`}>
        {fmtVol(tick.volume)}
      </td>

      <td
        className={`px-3.5 py-3 border-b ${border} font-mono ${muted} hidden md:table-cell`}
      >
        {fmt(tick.high24h, 2)}
      </td>

      <td
        className={`px-3.5 py-3 border-b ${border} font-mono ${muted} hidden md:table-cell`}
      >
        {fmt(tick.low24h, 2)}
      </td>
    </tr>
  );
};

// ─── Column definitions ─────────────────────────────

const COLUMNS = [
  { label: "Instrument", hide: "" },
  { label: "Price", hide: "" },
  { label: "Change", hide: "" },
  { label: "%", hide: "" },
  { label: "Trend", hide: "hidden lg:table-cell" },
  { label: "Bid", hide: "hidden lg:table-cell" },
  { label: "Ask", hide: "hidden lg:table-cell" },
  { label: "Spread", hide: "hidden lg:table-cell" },
  { label: "Volume", hide: "" },
  { label: "24h Hi", hide: "hidden md:table-cell" },
  { label: "24h Lo", hide: "hidden md:table-cell" },
] as const;

// ─── Main Dashboard ─────────────────────────────────

const PriceFeedDashboard: FC<DashboardProps> = ({
  url = "http://127.0.0.1:8000",
  instruments,
}) => {
  const { darkMode } = useDarkMode();
  const { ticks, connected } = usePriceFeed(url, instruments);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const sorted = instruments
    .map((s) => ticks[s])
    .filter(Boolean) as EnrichedTick[];

  // ── theme tokens ──
  const bg = darkMode ? "bg-[#0b0e11]" : "bg-slate-50";
  const text = darkMode ? "text-slate-300" : "text-slate-700";
  const heading = darkMode ? "text-white" : "text-slate-900";
  const surface = darkMode ? "bg-[#131920]" : "bg-white";
  const border = darkMode ? "border-slate-700/60" : "border-slate-200";
  const muted = darkMode ? "text-slate-500" : "text-slate-400";
  const mutedBorder = darkMode ? "text-slate-700" : "text-slate-300";

  return (
    <div
      className={`min-h-screen ${bg} ${text} p-5 md:p-6 font-sans transition-colors duration-200`}
    >
      {/* ── Header ── */}
      <header
        className={`flex items-center justify-between pb-5 mb-5 border-b ${border}`}
      >
        <div
          className={`font-bold text-lg tracking-[0.12em] uppercase ${heading}`}
        >
          <span className="text-blue-500 mr-1.5">◆</span>
          Price Feed
        </div>

        <div className={`flex items-center gap-2.5 text-sm ${muted}`}>
          <span
            className={`
              inline-block w-[7px] h-[7px] rounded-full animate-pulse
              ${
                connected
                  ? "bg-emerald-500 shadow-[0_0_6px_theme(colors.emerald.500)]"
                  : "bg-red-500 shadow-[0_0_6px_theme(colors.red.500)]"
              }
            `}
          />
          <span>{connected ? "LIVE" : "DISCONNECTED"}</span>
          <span className={mutedBorder}>|</span>
          <span className="font-mono text-sm">
            {clock.toLocaleTimeString("en-GB")}
          </span>
        </div>
      </header>

      {/* ── Summary Cards ── */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {sorted.slice(0, 6).map((t) => {
            const isUp = t.change >= 0;
            return (
              <div
                key={t.symbol}
                className={`
                  ${surface} border ${border} rounded-lg px-4 py-3.5
                  transition-colors hover:border-blue-400
                  ${isUp ? "border-l-[3px] border-l-emerald-500" : "border-l-[3px] border-l-red-500"}
                `}
              >
                <div
                  className={`text-xs tracking-[0.08em] uppercase mb-1.5 ${muted}`}
                >
                  {t.symbol}
                </div>
                <div
                  className={`font-mono text-2xl font-semibold ${isUp ? "text-emerald-500" : "text-red-500"}`}
                >
                  {fmt(t.price, t.price < 1 ? 4 : 2)}
                </div>
                <div
                  className={`font-mono text-sm mt-1 ${isUp ? "text-emerald-500" : "text-red-500"}`}
                >
                  {isUp ? "▲" : "▼"} {fmtPct(t.changePct)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Table ── */}
      <div className={`overflow-x-auto border ${border} rounded-lg ${surface}`}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.label}
                  className={`
                    text-left px-3.5 py-3 text-xs tracking-[0.1em] uppercase
                    ${muted} border-b ${border} whitespace-nowrap
                    sticky top-0 ${surface} z-10
                    ${col.hide}
                  `}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className={`text-center py-10 ${muted} italic`}
                >
                  {connected
                    ? "Waiting for price data…"
                    : "Connecting to feed…"}
                </td>
              </tr>
            ) : (
              sorted.map((t) => (
                <TickRow key={t.symbol} tick={t} dark={darkMode} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      <footer
        className={`text-center text-xs ${muted} mt-4 pt-3 border-t ${border}`}
      >
        {sorted.length} instruments ·{" "}
        {Object.values(ticks).reduce((a, t) => a + (t.sequence ?? 0), 0)} ticks
        received
      </footer>
    </div>
  );
};

export { PriceFeedDashboard };
