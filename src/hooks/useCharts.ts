/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  createChart,
  AreaSeries,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { ChartType } from "../types/chart.types";

export type AreaPoint = { time: UTCTimestamp; value: number };
export type CandlePoint = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
};

type AnySeries = ISeriesApi<"Area"> | ISeriesApi<"Candlestick">;

export const useChart = (chartType: ChartType) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<AnySeries | null>(null);

  const applyExpandedVisibleRange = useCallback(
    (points: { time: UTCTimestamp }[]) => {
      const chart = chartRef.current;
      if (!chart || !points.length) return;

      const times = points.map((p) => Number(p.time));
      const min = Math.min(...times);
      const max = Math.max(...times);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return;

      const span = max - min;
      const leftPad = span * 0.3; // more space قبل دیتا
      const rightPad = span * 0.7; // بیشتر برای آینده

      chart.timeScale().setVisibleRange({
        from: (min - leftPad) as UTCTimestamp,
        to: (max + rightPad) as UTCTimestamp,
      });
    },
    [],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor : '#9a9a9a'
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: true,
        timeVisible: true,
        secondsVisible: true,
      },
    });

    chartRef.current = chart;

    const resizeObServer = new ResizeObserver(() => {
      chart.applyOptions({ autoSize: true });
    });
    resizeObServer.observe(containerRef.current);

    return () => {
      resizeObServer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }

    if (chartType === "area") {
      seriesRef.current = chart.addSeries(AreaSeries, {
        lineWidth: 2,
      }) as ISeriesApi<"Area">;
    } else {
      seriesRef.current = chart.addSeries(
        CandlestickSeries,
        {},
      ) as ISeriesApi<"Candlestick">;
    }
  }, [chartType]);

  //Actions
  const setAreaData = useCallback(
    (data: AreaPoint[]) => {
      if (!seriesRef.current || chartType !== "area") return;

      (seriesRef.current as ISeriesApi<"Area">).setData(data);
      applyExpandedVisibleRange(data);
    },
    [chartType, applyExpandedVisibleRange],
  );

  const updateArea = useCallback(
    (p: AreaPoint) => {
      if (!seriesRef.current || chartType !== "area") return;

      (seriesRef.current as ISeriesApi<"Area">).update(p);
      chartRef.current?.timeScale().scrollToRealTime();
    },
    [chartType],
  );

  const setCandleData = useCallback(
    (data: CandlePoint[]) => {
      if (!seriesRef.current || chartType !== "candle") return;

      (seriesRef.current as ISeriesApi<"Candlestick">).setData(data);
      applyExpandedVisibleRange(data);
    },
    [chartType, applyExpandedVisibleRange],
  );

  const updateCandle = useCallback(
    (p: CandlePoint) => {
      if (!seriesRef.current || chartType !== "candle") return;

      (seriesRef.current as ISeriesApi<"Candlestick">).update(p);
      chartRef.current?.timeScale().scrollToRealTime();
    },
    [chartType],
  );

  const clear = useCallback(() => {
    if (!seriesRef.current) return;

    (seriesRef.current as any).setData([]);
  }, []);

  return useMemo(
    () => ({
      containerRef,
      chartRef,
      setAreaData,
      updateArea,
      setCandleData,
      updateCandle,
      clear,
    }),
    [setAreaData, updateArea, setCandleData, updateCandle, clear],
  );
};
