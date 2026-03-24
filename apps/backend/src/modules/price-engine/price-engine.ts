import { Inject, Injectable } from '@nestjs/common';
import { DatetimeService } from '@technical/datetime/datetime.service';

export interface CommodityConfig {
  symbol: string;
  name: string;
  unit: string;
  basePrice: number; // long-term mean price
  volatility: number; // annualised volatility (σ)
  meanReversion: number; // speed of mean reversion (θ)
  minPrice: number;
  maxPrice: number;
  seasonalAmplitude: number; // fraction of basePrice for seasonal swing
  peakMonth: number; // 0-indexed month of seasonal peak
}

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

export const ENERGY_COMMODITIES: CommodityConfig[] = [
  {
    symbol: 'NG',
    name: 'Natural Gas (Henry Hub)',
    unit: '$/MMBtu',
    basePrice: 3.25,
    volatility: 0.45,
    meanReversion: 0.15,
    minPrice: 1.5,
    maxPrice: 9.0,
    seasonalAmplitude: 0.18,
    peakMonth: 0, // January
  },
  {
    symbol: 'CL',
    name: 'Crude Oil (WTI)',
    unit: '$/barrel',
    basePrice: 75.0,
    volatility: 0.3,
    meanReversion: 0.08,
    minPrice: 40.0,
    maxPrice: 130.0,
    seasonalAmplitude: 0.06,
    peakMonth: 6, // July (driving season)
  },
  {
    symbol: 'BZ',
    name: 'Brent Crude',
    unit: '$/barrel',
    basePrice: 79.0,
    volatility: 0.28,
    meanReversion: 0.08,
    minPrice: 42.0,
    maxPrice: 135.0,
    seasonalAmplitude: 0.05,
    peakMonth: 6,
  },
  {
    symbol: 'RB',
    name: 'RBOB Gasoline',
    unit: '$/gallon',
    basePrice: 2.45,
    volatility: 0.35,
    meanReversion: 0.1,
    minPrice: 1.2,
    maxPrice: 4.5,
    seasonalAmplitude: 0.12,
    peakMonth: 5, // June
  },
  {
    symbol: 'HO',
    name: 'Heating Oil',
    unit: '$/gallon',
    basePrice: 2.65,
    volatility: 0.32,
    meanReversion: 0.1,
    minPrice: 1.3,
    maxPrice: 5.0,
    seasonalAmplitude: 0.14,
    peakMonth: 0, // January
  },
  {
    symbol: 'EL',
    name: 'PJM Electricity (Peak)',
    unit: '$/MWh',
    basePrice: 45.0,
    volatility: 0.55,
    meanReversion: 0.2,
    minPrice: 18.0,
    maxPrice: 200.0,
    seasonalAmplitude: 0.22,
    peakMonth: 7, // August
  },
  {
    symbol: 'CO2',
    name: 'EU Carbon Allowance (EUA)',
    unit: '€/tonne',
    basePrice: 65.0,
    volatility: 0.25,
    meanReversion: 0.05,
    minPrice: 30.0,
    maxPrice: 110.0,
    seasonalAmplitude: 0.04,
    peakMonth: 11, // December (compliance)
  },
  {
    symbol: 'UR',
    name: 'Uranium (U3O8)',
    unit: '$/lb',
    basePrice: 85.0,
    volatility: 0.22,
    meanReversion: 0.04,
    minPrice: 40.0,
    maxPrice: 150.0,
    seasonalAmplitude: 0.02,
    peakMonth: 3,
  },
];

export const COMMODITIES_CONFIG = Symbol('COMMODITIES_CONFIG');

@Injectable()
export class PriceEngine {
  private prices: Map<string, number> = new Map();
  private highs: Map<string, number> = new Map();
  private lows: Map<string, number> = new Map();
  private volumes: Map<string, number> = new Map();
  private vwapNumerator: Map<string, number> = new Map();
  private sequence = 0;

  constructor(
    private readonly datetimeService: DatetimeService,
    @Inject(COMMODITIES_CONFIG)
    private commodities: CommodityConfig[],
  ) {
    for (const c of commodities) {
      // Start near base price with a small random offset
      const initial = c.basePrice * (1 + (Math.random() - 0.5) * 0.06);
      this.prices.set(c.symbol, this.clamp(initial, c));
      this.highs.set(c.symbol, initial);
      this.lows.set(c.symbol, initial);
      this.volumes.set(c.symbol, 0);
      this.vwapNumerator.set(c.symbol, 0);
    }
  }

  tick(dtSeconds: number): PriceTick[] {
    this.sequence++;
    const now = this.datetimeService.new();
    const month = now.getMonth();

    return this.commodities.map((c) => {
      const prevPrice = this.prices.get(c.symbol)!;

      // Seasonal component
      const seasonalAngle = ((2 * Math.PI) / 12) * (month - c.peakMonth);
      const seasonalFactor = 1 + c.seasonalAmplitude * Math.cos(seasonalAngle);
      const adjustedMean = c.basePrice * seasonalFactor;

      // Ornstein-Uhlenbeck step  (mean-reverting diffusion)
      const dt = dtSeconds / (365.25 * 24 * 3600); // fraction of a year
      const drift = c.meanReversion * (adjustedMean - prevPrice) * dt;
      const diffusion =
        c.volatility * prevPrice * Math.sqrt(dt) * this.gaussianRandom();

      // Rare volatility spike (≈2 % chance per tick)
      let spike = 0;
      if (Math.random() < 0.02) {
        spike =
          prevPrice *
          c.volatility *
          0.8 *
          (Math.random() > 0.5 ? 1 : -1) *
          Math.random();
      }

      let newPrice = prevPrice + drift + diffusion + spike;
      newPrice = this.clamp(newPrice, c);
      newPrice = this.roundPrice(newPrice, c);

      this.prices.set(c.symbol, newPrice);

      // 24h tracking
      const high = Math.max(this.highs.get(c.symbol)!, newPrice);
      const low = Math.min(this.lows.get(c.symbol)!, newPrice);
      this.highs.set(c.symbol, high);
      this.lows.set(c.symbol, low);

      // Volume simulation  (higher vol -> more trading)
      const tickVolume = Math.round(
        (100 + Math.random() * 900) *
          (1 + Math.abs(newPrice - prevPrice) / prevPrice) *
          10,
      );
      const cumVol = this.volumes.get(c.symbol)! + tickVolume;
      this.volumes.set(c.symbol, cumVol);

      const cumVwap = this.vwapNumerator.get(c.symbol)! + tickVolume * newPrice;
      this.vwapNumerator.set(c.symbol, cumVwap);
      const vwap = cumVwap / cumVol;

      // Bid / Ask spread (tighter for liquid markets)
      const halfSpread =
        newPrice * (0.0002 + Math.random() * 0.0008) * (c.volatility / 0.3);
      const bid = this.roundPrice(newPrice - halfSpread, c);
      const ask = this.roundPrice(newPrice + halfSpread, c);

      const change = newPrice - prevPrice;
      const changePct = (change / prevPrice) * 100;

      return {
        symbol: c.symbol,
        name: c.name,
        unit: c.unit,
        price: newPrice,
        previousPrice: prevPrice,
        change: parseFloat(change.toFixed(4)),
        changePct: parseFloat(changePct.toFixed(4)),
        bid,
        ask,
        spread: parseFloat((ask - bid).toFixed(4)),
        volume: cumVol,
        high24h: high,
        low24h: low,
        vwap24h: parseFloat(vwap.toFixed(4)),
        timestamp: now.toISOString(),
        sequence: this.sequence,
      } satisfies PriceTick;
    });
  }

  private gaussianRandom(): number {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  private clamp(price: number, c: CommodityConfig): number {
    return Math.max(c.minPrice, Math.min(c.maxPrice, price));
  }

  private roundPrice(price: number, c: CommodityConfig): number {
    // Prices < $10 → 4 decimals; < $100 → 2; else → 2
    const decimals = c.basePrice < 10 ? 4 : 2;
    return parseFloat(price.toFixed(decimals));
  }
}
