import { clsx, type ClassValue } from "clsx";
import type { UTCTimestamp } from "lightweight-charts";
import { twMerge } from "tailwind-merge";
import type { AreaPoint } from "../types/chart.types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fromAscii = (asciiArray: number[]) => {
  const str = asciiArray.map((code) => String.fromCharCode(code)).join("");
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
};

export const toUTCTimestamp = (isoOrNumber: string | number): UTCTimestamp => {
  if (typeof isoOrNumber === "number") {
    const sec =
      isoOrNumber > 2_000_000_000_000
        ? Math.floor(isoOrNumber / 1000)
        : Math.floor(isoOrNumber);
    return sec as UTCTimestamp;
  }
  return Math.floor(new Date(isoOrNumber).getTime() / 1000) as UTCTimestamp;
};

export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export const toSec = (t: number) => Math.floor(t) as UTCTimestamp;

export const isoToSec = (iso: string) =>
  Math.floor(new Date(iso).getTime() / 1000) as UTCTimestamp;

export const dedupeArea = (items: AreaPoint[]) => {
  const m = new Map<number, AreaPoint>();
  for (const p of items) m.set(Number(p.time), p);
  return Array.from(m.values()).sort((a, b) => Number(a.time) - Number(b.time));
};
