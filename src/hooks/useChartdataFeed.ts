/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import type { UTCTimestamp } from "lightweight-charts";
import type { ChartType, OldAreaPoint } from "../types/chart.types";
import { dedupeArea, fromAscii, toSec } from "../lib/utils";

type AreaRealtime = { time: number; value: number };
type CandleRealtime = { [key: string]: any };

type AreaPoint = { time: UTCTimestamp; value: number };
type CandlePoint = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
};

type Args = {
  socket: Socket;
  isConnected: boolean;
  symbol: string;
  chartType: ChartType;

  setAreaData: (data: AreaPoint[]) => void;
  // setCandleData: (data: CandlePoint[]) => void;

  updateArea: (point: AreaPoint) => void;
  // updateCandle: (point: CandlePoint) => void;

  clear: () => void;
};

export const useChartDataFeed = ({
  socket,
  isConnected,
  symbol,
  chartType,
  setAreaData,
  updateArea,
  // updateCandle,
  clear,
}: Args) => {
  const activeRef = useRef<{ symbol: string; chartType: ChartType } | null>(
    null,
  );

  const areaBufferRef = useRef<AreaPoint[]>([]);
  const candleBufferRef = useRef<CandlePoint[]>([]);

  const earliestRef = useRef<UTCTimestamp | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    const onUpdateOldData = (ascii: number[]) => {
      const decoded = fromAscii(ascii);

      if (chartType === "area") {
        const arr = decoded as OldAreaPoint[];

        const bySecond = new Map<number, AreaPoint>();
        for (const p of arr) {
          const t = Math.floor(p.time);
          bySecond.set(t, { time: t as UTCTimestamp, value: p.value });
        }

        const chunk = Array.from(bySecond.values());

        const merged = [...chunk, ...areaBufferRef.current];

        const cleanAll = dedupeArea(merged);

        areaBufferRef.current = cleanAll;
        earliestRef.current = cleanAll[0]?.time ?? null;

        setAreaData(cleanAll);
        return;
      }

      if (chartType === "candle") {
        console.log(decoded);
      }
    };

    const onUpdateStream = (ascii: number[]) => {
      const decoded = fromAscii(ascii);

      if (chartType === "area") {
        const d = decoded as AreaRealtime;

        updateArea({
          time: toSec(d.time),
          value: d.value,
        });

        return;
      }

      if (chartType === "candle") {
        const d = decoded as CandleRealtime;

        // const t =
        //   typeof d.timestamp === "string"
        //     ? isoToSec(d.timestamp)
        //     : typeof d.time === "number"
        //       ? toSec(d.time)
        //       : (Math.floor(Date.now() / 1000) as UTCTimestamp);

        if (typeof d.open !== "number") {
          console.warn("Candle stream unexpected payload:", d);
          return;
        }

        // updateCandle({
        //   time: t,
        //   open: d.open,
        //   high: d.high,
        //   low: d.low,
        //   close: d.close,
        // });

        return;
      }
    };

    socket.on("updateOldData", onUpdateOldData);
    socket.on("updateStream", onUpdateStream);

    return () => {
      socket.off("updateOldData", onUpdateOldData);
      socket.off("updateStream", onUpdateStream);
    };
  }, [isConnected, socket, chartType, setAreaData, updateArea]);

  useEffect(() => {
    if (!isConnected) return;

    const next = { symbol, chartType };
    const prev = activeRef.current;

    if (
      prev &&
      (prev.symbol !== next.symbol || prev.chartType !== next.chartType)
    ) {
      socket.emit("unsubscribe", prev);
    }

    activeRef.current = next;

    clear();
    areaBufferRef.current = [];
    candleBufferRef.current = [];
    earliestRef.current = null;

    const fallbackFirstTime = Date.now() / 1000;
    const firstTime = earliestRef.current ?? (fallbackFirstTime as any);

    socket.emit("requestOlderData", {
      symbol,
      chartType,
      firstTime,
    });

    socket.emit("subscribe", { symbol, chartType });

    return () => {
      if (activeRef.current) {
        socket.emit("unsubscribe", activeRef.current);
        activeRef.current = null;
      }
    };
  }, [isConnected, socket, symbol, chartType, clear]);

  const requestMoreOld = () => {
    const firstTime = earliestRef.current;
    if (!firstTime) return;

    socket.emit("requestOlderData", {
      symbol,
      chartType,
      firstTime,
    });
  };

  return { requestMoreOld };
};
