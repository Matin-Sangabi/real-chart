import Header from "./components/Header";
import { RealTimeChart } from "./components/ReadTime";

export default function App() {
  return (
    <div className="w-full min-h-dvh flex flex-col gap-y-2 bg-slate-900 overflow-auto p-2">
      <Header />
      <RealTimeChart />
    </div>
  );
}
