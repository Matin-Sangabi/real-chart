/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  createChart,
  AreaSeries,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
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

  // dynamic timestamps
  const syncRightOffsetToCenter = useCallback(() => {
    const chart = chartRef.current;
    const container = containerRef.current;
    if (!chart || !container) return;

    const ts = chart.timeScale();
    const width = container.clientWidth || 600;

    const barSpacing = ts.options().barSpacing ?? 6;
    const barsOnScreen = Math.max(10, Math.floor(width / barSpacing));

    const desiredRightOffset = Math.floor(barsOnScreen / 2);

    chart.applyOptions({
      timeScale: {
        rightOffset: desiredRightOffset,
      },
    });
  }, []);

  // handle 15 and 30 seconds
  const applyDynamicTickFormatter = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const ts = chart.timeScale();
    const range = ts.getVisibleRange();
    if (!range) return;

    const spanSec = Math.max(1, Number(range.to) - Number(range.from));
    const zoomedIn = spanSec <= 10 * 60;
    const step = zoomedIn ? 15 : 30 * 60;

    chart.applyOptions({
      timeScale: {
        tickMarkFormatter: (time: Time) => {
          if (typeof time !== "number") return "";
          const t = time as number;

          if (t % step !== 0) return "";

          const d = new Date(t * 1000);
          return zoomedIn
            ? d.toISOString().slice(11, 19)
            : d.toISOString().slice(11, 16);
        },
      },
    });
  }, []);

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
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    const ts = chart.timeScale();

    const onRangeChange = () => {
      syncRightOffsetToCenter();
      applyDynamicTickFormatter();
    };

    ts.subscribeVisibleTimeRangeChange(onRangeChange);

    const resizeObServer = new ResizeObserver(() => {
      chart.applyOptions({ autoSize: true });
      syncRightOffsetToCenter();
      applyDynamicTickFormatter();
    });
    resizeObServer.observe(containerRef.current);

    syncRightOffsetToCenter();
    applyDynamicTickFormatter();

    return () => {
      ts.unsubscribeVisibleTimeRangeChange(onRangeChange);
      resizeObServer.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [syncRightOffsetToCenter, applyDynamicTickFormatter]);

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
      syncRightOffsetToCenter();
      chartRef.current?.timeScale().scrollToRealTime();
    },
    [chartType, syncRightOffsetToCenter],
  );

  const updateArea = useCallback(
    (p: AreaPoint) => {
      if (!seriesRef.current || chartType !== "area") return;

      (seriesRef.current as ISeriesApi<"Area">).update(p);
      syncRightOffsetToCenter();
      chartRef.current?.timeScale().scrollToRealTime();
    },
    [chartType, syncRightOffsetToCenter],
  );

  const setCandleData = useCallback(
    (data: CandlePoint[]) => {
      if (!seriesRef.current || chartType !== "candle") return;

      (seriesRef.current as ISeriesApi<"Candlestick">).setData(data);
      syncRightOffsetToCenter();
      chartRef.current?.timeScale().scrollToRealTime();
    },
    [chartType, syncRightOffsetToCenter],
  );

  const updateCandle = useCallback(
    (p: CandlePoint) => {
      if (!seriesRef.current || chartType !== "candle") return;

      (seriesRef.current as ISeriesApi<"Candlestick">).update(p);
      syncRightOffsetToCenter();
      chartRef.current?.timeScale().scrollToRealTime();
    },
    [chartType, syncRightOffsetToCenter],
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
