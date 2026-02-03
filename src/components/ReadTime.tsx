/* eslint-disable react-hooks/refs */
import React from "react";
import useUserSession from "../hooks/useUserSession";
import { useChart } from "../hooks/useCharts";
import { useChartDataFeed } from "../hooks/useChartdataFeed";

export const RealTimeChart: React.FC = () => {
  const { socket, isConnected, userReady } = useUserSession();

  const symbol = userReady?.lastAsset ?? "XAUUSD";
  const chartType = userReady?.chartType ?? "area";

  const chart = useChart(chartType);

  useChartDataFeed({
    socket,
    isConnected,
    symbol,
    chartType,
    setAreaData: chart.setAreaData,
    setCandleData: chart.setCandleData,
    updateArea: chart.updateArea,
    updateCandle: chart.updateCandle,
    clear: chart.clear,
  });

  return (
    <>
      <div className="max-w-7xl mx-auto w-full flex items-center flex-col justify-center h-full text-slate-400 flex-1">
        <div className="w-full p-2  rounded-xl bg-slate-800 h-120 ">
          <div ref={chart.containerRef} className="w-full h-full rounded-xl" />
        </div>
        <div className="flex  items-center justify-start mt-2  text-xs">
          {isConnected ? "Connected" : "Disconnected"} | {symbol} | {chartType}
        </div>
      </div>
    </>
  );
};
