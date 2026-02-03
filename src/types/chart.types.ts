import type { UTCTimestamp } from "lightweight-charts";

export type ChartType = "area" | "candle";

export type UserReadyPayload = {
  lastAsset: string;
  time: number;
  amount: number;
  payout: number;
  chartType: ChartType;
};

export type AreaStream = {
  time: number;
  value: number;
  volume?: number;
};

export type CandleStream = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type AreaPoint = { time: UTCTimestamp; value: number };
export type CandlePoint = {
  time: UTCTimestamp;
  open: number;
  hight: number;
  low: number;
  close: number;
};

export type OldAreaPoint = { time: number; value: number };
