import React, { useState, useEffect } from 'react';

export const GrafanaDevOpsTab: React.FC = () => {
  const [timeRange, setTimeRange] = useState('Last 15 minutes');
  const [refreshInterval, setRefreshInterval] = useState('5s');
  const [isLive, setIsLive] = useState(true);
  const [liveReqCount, setLiveReqCount] = useState(148);
  const [p95Latency, setP95Latency] = useState(38);
  const [logFilter, setLogFilter] = useState<'ALL' | 'WARN' | 'ERROR'>('ALL');

  // Streaming simulated logs
  const [logs, setLogs] = useState([
    { id: 1, time: '14:28:44', level: 'INFO', service: 'orders-service', msg: 'COD checkout created: ORD-9942 (District: Al-Karrada, 84,000 IQD)' },
    { id: 2, time: '14:28:47', level: 'INFO', service: 'dispatch-engine', msg: 'Assigned Mechanic "Ali Al-Saree" to SOS distress ticket #SOS-119' },
    { id: 3, time: '14:28:51', level: 'INFO', service: 'inventory-sync', msg: 'Stock decrement: BRM-7045-SP at Dora Hub (New balance: 8)' },
    { id: 4, time: '14:28:56', level: 'INFO', service: 'auth-gateway', msg: 'Bearer token validated for user "sajjad_iq" from IP 185.120.44.12' },
    { id: 5, time: '14:29:02', level: 'WARN', service: 'warehouse-monitor', msg: 'Low stock threshold reached: YUA-BAT-12V9 at Cairo Hub (Balance: 4)' },
    { id: 6, time: '14:29:08', level: 'INFO', service: 'fcm-broadcaster', msg: 'Pushed notification to topic "all_baghdad_riders" (Recipients: 4,820)' },
  ]);

  // Periodic live metric fluctuation
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setLiveReqCount((prev) => Math.max(120, Math.min(220, prev + Math.floor((Math.random() - 0.48) * 8))));
      setP95Latency((prev) => Math.max(32, Math.min(65, prev + Math.floor((Math.random() - 0.5) * 4))));
    }, 3000);
    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans" dir="ltr">
      {/* Grafana Navigation & Controls Header */}
      <div className="bg-[#111217] border border-[#22252b] rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F46800]/20 text-[#F46800] flex items-center justify-center font-bold font-mono">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[1.25rem] font-bold text-white tracking-tight">
                Grafana Observability & Cloud Run Telemetry
              </h2>
              <span className="text-[11px] bg-[#22252b] text-[#F46800] px-2 py-0.5 rounded font-mono font-bold">
                v10.4.1
              </span>
            </div>
            <p className="text-[0.8125rem] text-[#8e95a5]">
              Dokan Saleem Baghdad Infrastructure: Europe-West2 Cloud Run, Cloud SQL PostgreSQL, Redis Cache.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 bg-[#181b1f] border border-[#2c3235] px-2.5 py-1.5 rounded-lg text-[12px] font-mono text-[#c3c6d5]">
            <span className="material-symbols-outlined text-[16px] text-[#F46800]">schedule</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent outline-none cursor-pointer text-white"
            >
              <option value="Last 15 minutes">Last 15 minutes</option>
              <option value="Last 1 hour">Last 1 hour</option>
              <option value="Last 24 hours">Last 24 hours</option>
            </select>
          </div>

          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-mono font-bold flex items-center gap-1.5 transition-all ${
              isLive ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/50' : 'bg-gray-800 text-gray-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`}></span>
            <span>{isLive ? 'Live Stream (5s)' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* Main Grafana Stat Panels Grid (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Panel 1: RPS */}
        <div className="bg-[#181b1f] border border-[#22252b] rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[#8e95a5] text-[12px]">
            <span className="font-semibold">Cloud Run Request Rate (RPS)</span>
            <span className="material-symbols-outlined text-[16px] text-[#56a4ff]">speed</span>
          </div>
          <div className="my-2">
            <span className="text-[2rem] font-bold font-mono text-[#56a4ff]">{liveReqCount}</span>
            <span className="text-[12px] text-[#8e95a5] ml-1.5">req/s</span>
          </div>
          {/* Sparkline mini-graph */}
          <div className="h-6 flex items-end gap-1 pt-1">
            {[45, 60, 52, 78, 65, 82, 70, 95, 88, 102, 94, liveReqCount].map((v, i) => (
              <div
                key={i}
                style={{ height: `${Math.min(100, (v / 180) * 100)}%` }}
                className="flex-1 bg-[#56a4ff]/60 hover:bg-[#56a4ff] rounded-t transition-all"
              />
            ))}
          </div>
        </div>

        {/* Panel 2: P95 Latency */}
        <div className="bg-[#181b1f] border border-[#22252b] rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[#8e95a5] text-[12px]">
            <span className="font-semibold">P95 API Latency</span>
            <span className="material-symbols-outlined text-[16px] text-emerald-400">timer</span>
          </div>
          <div className="my-2">
            <span className="text-[2rem] font-bold font-mono text-emerald-400">{p95Latency}</span>
            <span className="text-[12px] text-[#8e95a5] ml-1.5">ms</span>
          </div>
          <div className="h-6 flex items-end gap-1 pt-1">
            {[34, 38, 41, 36, 42, 45, 39, 41, 37, 43, 40, p95Latency].map((v, i) => (
              <div
                key={i}
                style={{ height: `${Math.min(100, (v / 70) * 100)}%` }}
                className="flex-1 bg-emerald-500/60 hover:bg-emerald-400 rounded-t transition-all"
              />
            ))}
          </div>
        </div>

        {/* Panel 3: Error Rate */}
        <div className="bg-[#181b1f] border border-[#22252b] rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[#8e95a5] text-[12px]">
            <span className="font-semibold">HTTP 5xx Error Rate</span>
            <span className="material-symbols-outlined text-[16px] text-emerald-400">verified</span>
          </div>
          <div className="my-2">
            <span className="text-[2rem] font-bold font-mono text-emerald-400">0.02%</span>
            <span className="text-[12px] text-emerald-400/80 ml-1.5">Healthy</span>
          </div>
          <div className="text-[11px] text-[#8e95a5] flex items-center justify-between">
            <span>2xx Success: 99.98%</span>
            <span>4xx: 0.12%</span>
          </div>
        </div>

        {/* Panel 4: Redis Cache Hit */}
        <div className="bg-[#181b1f] border border-[#22252b] rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[#8e95a5] text-[12px]">
            <span className="font-semibold">Redis Cache Hit Ratio</span>
            <span className="material-symbols-outlined text-[16px] text-[#ff9830]">bolt</span>
          </div>
          <div className="my-2">
            <span className="text-[2rem] font-bold font-mono text-[#ff9830]">94.8%</span>
            <span className="text-[12px] text-[#8e95a5] ml-1.5">in-memory</span>
          </div>
          <div className="text-[11px] text-[#8e95a5]">
            Parts catalog & fitment matrix cached
          </div>
        </div>
      </div>

      {/* Middle Row: Database & Fleet Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cloud SQL Connection Pool */}
        <div className="bg-[#181b1f] border border-[#22252b] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#22252b] pb-3">
            <h3 className="font-bold text-white text-[0.9375rem] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#56a4ff]">database</span>
              <span>PostgreSQL Connection Pool & Query IOPS</span>
            </h3>
            <span className="text-[11px] bg-[#22252b] text-[#56a4ff] px-2 py-0.5 rounded font-mono">
              Cloud SQL Dev Instance
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-[#111217] rounded-lg">
              <span className="text-[11px] text-[#8e95a5] block">Active Connections</span>
              <span className="text-[1.25rem] font-bold font-mono text-white">14 / 60</span>
            </div>
            <div className="p-3 bg-[#111217] rounded-lg">
              <span className="text-[11px] text-[#8e95a5] block">Average Query Time</span>
              <span className="text-[1.25rem] font-bold font-mono text-emerald-400">4.2ms</span>
            </div>
            <div className="p-3 bg-[#111217] rounded-lg">
              <span className="text-[11px] text-[#8e95a5] block">Disk Storage</span>
              <span className="text-[1.25rem] font-bold font-mono text-white">2.8 GB / 10 GB</span>
            </div>
          </div>
        </div>

        {/* Baghdad Dispatch Fleet Telemetry */}
        <div className="bg-[#181b1f] border border-[#22252b] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#22252b] pb-3">
            <h3 className="font-bold text-white text-[0.9375rem] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#F46800]">two_wheeler</span>
              <span>Baghdad Real-time Dispatch Telemetry</span>
            </h3>
            <span className="text-[11px] bg-[#22252b] text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
              ● 18 Vans & Bikes Online
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-[#111217] rounded-lg">
              <span className="text-[11px] text-[#8e95a5] block">Avg Delivery ETA</span>
              <span className="text-[1.25rem] font-bold font-mono text-[#F46800]">38 mins</span>
            </div>
            <div className="p-3 bg-[#111217] rounded-lg">
              <span className="text-[11px] text-[#8e95a5] block">Roadside SOS ETA</span>
              <span className="text-[1.25rem] font-bold font-mono text-emerald-400">14 mins</span>
            </div>
            <div className="p-3 bg-[#111217] rounded-lg">
              <span className="text-[11px] text-[#8e95a5] block">GPS Pings / Min</span>
              <span className="text-[1.25rem] font-bold font-mono text-white">360 pings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Stream Terminal Logs Viewer (stdout) */}
      <div className="bg-[#111217] border border-[#22252b] rounded-xl p-5 space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-[#22252b] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8e95a5] text-[18px]">terminal</span>
            <h3 className="font-bold text-white text-[0.875rem]">Live Container stdout / Cloud Run Log Stream</h3>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <button
              onClick={() => setLogFilter('ALL')}
              className={`px-2 py-1 rounded ${logFilter === 'ALL' ? 'bg-[#56a4ff] text-black font-bold' : 'text-[#8e95a5]'}`}
            >
              ALL
            </button>
            <button
              onClick={() => setLogFilter('WARN')}
              className={`px-2 py-1 rounded ${logFilter === 'WARN' ? 'bg-[#ff9830] text-black font-bold' : 'text-[#8e95a5]'}`}
            >
              WARN
            </button>
          </div>
        </div>

        <div className="bg-[#0b0c0e] p-3 rounded-lg text-[12px] space-y-1.5 overflow-x-auto max-h-56">
          {logs.map((log) => (
            <div key={log.id} className="flex items-baseline gap-3">
              <span className="text-[#8e95a5] text-[11px]">{log.time}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  log.level === 'WARN' ? 'bg-[#ff9830]/20 text-[#ff9830]' : 'bg-blue-900/30 text-blue-300'
                }`}
              >
                {log.level}
              </span>
              <span className="text-[#c3c6d5] font-semibold">[{log.service}]</span>
              <span className="text-white flex-1">{log.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
