/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  createChart,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

export type AreaPoint = {
  time: UTCTimestamp;
  value: number;
};

const VIRTUAL_PAD_SECONDS = 60 * 60;

export function useChart() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  function extendWithVirtualPadding(real: AreaPoint[]) {
    if (real.length === 0) return { data: [], leftCount: 0 };

    const first = real[0].time;
    const left: any[] = [];

    for (let t = first - VIRTUAL_PAD_SECONDS; t < first; t++) {
      left.push({ time: t as UTCTimestamp });
    }

    return {
      data: [...left, ...real],
      leftCount: left.length,
      realCount: real.length,
    };
  }

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: "#9a9a9a",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        rightBarStaysOnScroll: true,
        fixLeftEdge: false,
        fixRightEdge: false,
      },
    });

    chart.applyOptions({
      localization: {
        timeFormatter: (time: number) => {
          const date = new Date(time * 1000);
          const range = chart.timeScale().getVisibleRange();
          if (!range) return "";

          const span = Number(range.to) - Number(range.from);

          if (span < 60 * 5) {
            return date.toLocaleTimeString(undefined, {
              minute: "2-digit",
              second: "2-digit",
            });
          }

          return date.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          });
        },
      },
    });

    const series = chart.addSeries(AreaSeries, {
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ autoSize: true });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  const setAreaData = useCallback((realData: AreaPoint[]) => {
    if (!seriesRef.current || !chartRef.current) return;
    if (!realData.length) return;

    const { data } = extendWithVirtualPadding(realData);

    seriesRef.current.setData(data);
  }, []);

  const updateArea = useCallback((p: AreaPoint) => {
    if (!seriesRef.current) return;
    seriesRef.current.update(p);
  }, []);

  const clear = useCallback(() => {
    seriesRef.current?.setData([]);
  }, []);

  return useMemo(
    () => ({
      containerRef,
      setAreaData,
      updateArea,
      clear,
    }),
    [setAreaData, updateArea, clear],
  );
}
