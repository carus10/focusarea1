import React, { useState, useContext, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { DataContext } from '../context/DataContext';
import type { AnalyticsPeriod } from '../types';
import {
  getDailyStats,
  getWeeklyStats,
  getMonthlyStats,
  type DailyStat,
  type WeeklyStat,
  type MonthlyStat,
} from '../utils/pomodoroStats';

// ── Period tab configuration ────────────────────────────────
interface PeriodTab {
  key: AnalyticsPeriod;
  label: string;
}

const PERIOD_TABS: PeriodTab[] = [
  { key: 'daily', label: 'Günlük' },
  { key: 'weekly', label: 'Haftalık' },
  { key: 'monthly', label: 'Aylık' },
];

// ── Helpers ─────────────────────────────────────────────────

/** Return the x-axis dataKey that matches the selected period. */
function xAxisKey(period: AnalyticsPeriod): string {
  switch (period) {
    case 'daily':
      return 'label';
    case 'weekly':
      return 'weekLabel';
    case 'monthly':
      return 'monthLabel';
  }
}

type ChartDatum = DailyStat | WeeklyStat | MonthlyStat;

// ── Custom Tooltip ──────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  return (
    <div
      className="rounded-lg px-3 py-2 text-sm shadow-lg"
      style={{
        backgroundColor: 'rgba(30,30,30,0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <p className="font-medium text-white mb-1">{label}</p>
      <p className="text-gray-300">
        🍅 {data.count} pomodoro
      </p>
      <p className="text-gray-300">
        ⏱ {data.minutes} dk
      </p>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────

const PomodoroHistory: React.FC = () => {
  const { pomodoroSessions } = useContext(DataContext);
  const [period, setPeriod] = useState<AnalyticsPeriod>('daily');

  // Compute chart data based on selected period
  const chartData: ChartDatum[] = useMemo(() => {
    switch (period) {
      case 'daily':
        return getDailyStats(pomodoroSessions, 7); // last 7 days
      case 'weekly':
        return getWeeklyStats(pomodoroSessions, 4); // last 4 weeks
      case 'monthly':
        return getMonthlyStats(pomodoroSessions, 6); // last 6 months
    }
  }, [pomodoroSessions, period]);

  // Summary totals
  const { totalCount, totalMinutes } = useMemo(() => {
    let count = 0;
    let minutes = 0;
    for (const d of chartData) {
      count += d.count;
      minutes += d.minutes;
    }
    return { totalCount: count, totalMinutes: minutes };
  }, [chartData]);

  // Find the max-count entry index to highlight it
  const maxIndex = useMemo(() => {
    let maxVal = 0;
    let idx = -1;
    chartData.forEach((d, i) => {
      if (d.count > maxVal) {
        maxVal = d.count;
        idx = i;
      }
    });
    return idx;
  }, [chartData]);

  return (
    <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-white/10">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h2 className="text-xl font-bold">Pomodoro Geçmişi</h2>

        {/* Period selector pills */}
        <div className="flex rounded-lg bg-gray-500/10 dark:bg-white/5 p-1">
          {PERIOD_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                period === tab.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary stats ──────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-gray-500/5 dark:bg-white/5 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{totalCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Toplam Pomodoro
          </p>
        </div>
        <div className="bg-gray-500/5 dark:bg-white/5 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{totalMinutes}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Toplam Dakika
          </p>
        </div>
      </div>

      {/* ── Bar Chart ──────────────────────────────────── */}
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="histBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(123, 92, 255, 0.6)" />
                <stop offset="100%" stopColor="rgba(123, 92, 255, 0.2)" />
              </linearGradient>
              <linearGradient id="histBarGradientHighlight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(123, 92, 255, 1)" />
                <stop offset="100%" stopColor="rgba(123, 92, 255, 0.5)" />
              </linearGradient>
            </defs>

            <XAxis
              dataKey={xAxisKey(period)}
              tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
              allowDecimals={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(123, 92, 255, 0.1)' }}
            />
            <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
              {chartData.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    index === maxIndex
                      ? 'url(#histBarGradientHighlight)'
                      : 'url(#histBarGradient)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(PomodoroHistory);
