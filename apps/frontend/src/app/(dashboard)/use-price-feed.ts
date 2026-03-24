import { useState, useRef, useMemo, useEffect } from "react";
import { io, Socket } from "socket.io-client";

export interface PriceTick {
  symbol: string;
  name: string;
  unit: string;
  price: number;
  previousPrice: number;
  change: number;
  changePct: number;
  bid: number;
  ask: number;
  spread: number;
  volume: number;
  high24h: number;
  low24h: number;
  vwap24h: number;
  timestamp: string;
  sequence: number;
}

export interface EnrichedTick extends PriceTick {
  _flash: "up" | "down" | null;
  _flashTs: number;
}
type TickMap = Record<string, EnrichedTick>;

export function usePriceFeed(
  url: string,
  instruments: string[],
): { ticks: TickMap; connected: boolean } {
  const [ticks, setTicks] = useState<TickMap>({});
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const instrumentsKey = useMemo(
    () => JSON.stringify(instruments),
    [instruments],
  );
  const [keepaliveInterval, setkeepAliveInterval] = useState<ReturnType<
    typeof setInterval
  > | null>(null);

  useEffect(() => {
    const socket = io(`${url}/price-feed`, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setkeepAliveInterval(
        setInterval(() => {
          socket.emit("keepalive");
        }, 20_000),
      );
    });

    socket.on("authenticated", () => {
      socket.emit("subscribe", { instruments });
    });

    socket.on("disconnect", () => {
      if (keepaliveInterval) clearInterval(keepaliveInterval);
      setConnected(false);
    });

    socket.on("price", (raw: string | PriceTick) => {
      try {
        const tick: PriceTick = typeof raw === "string" ? JSON.parse(raw) : raw;

        setTicks((prev) => {
          const old = prev[tick.symbol];
          const flash: "up" | "down" | null =
            tick.price > (old?.price ?? tick.price)
              ? "up"
              : tick.price < (old?.price ?? tick.price)
                ? "down"
                : (old?._flash ?? null);

          return {
            ...prev,
            [tick.symbol]: { ...tick, _flash: flash, _flashTs: Date.now() },
          };
        });
      } catch {
        /* ignore malformed */
      }
    });

    return () => {
      if (keepaliveInterval) clearInterval(keepaliveInterval);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [url, instrumentsKey]);

  return { ticks, connected };
}
