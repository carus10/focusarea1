import React, { useContext, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';
import { DataContext } from '../context/DataContext.tsx';
import { AnalyticsPeriod, PomodoroSession } from '../types.ts';
import Icon from '../components/Icon.tsx';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';

// --- Helper Functions ---
const getDateRange = (period: AnalyticsPeriod): { start: Date; end: Date; days: number } => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  if (period === 'daily') {
    start.setDate(start.getDate() - 6); // Son 7 gün (bugün dahil)
  } else if (period === 'weekly') {
    start.setDate(start.getDate() - 27); // Son 4 hafta
  } else {
    start.setDate(start.getDate() - 89); // Son 3 ay
  }
  start.setHours(0, 0, 0, 0);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return { start, end, days };
};

const formatDateLabel = (dateStr: string, period: AnalyticsPeriod): string => {
  const d = new Date(dateStr + 'T00:00:00'); // Ensure consistent parsing
  if (period === 'monthly') return `${d.toLocaleString('tr-TR', { month: 'short' })}`;
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

/** Dakikayı "X sa Y dk" formatına çevirir */
const formatDuration = (totalMinutes: number): string => {
  if (totalMinutes <= 0) return '0 dk';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} dk`;
  if (minutes === 0) return `${hours} sa`;
  return `${hours} sa ${minutes} dk`;
};

/** Session'ları tarih aralığına göre filtreler */
const filterSessionsByPeriod = (sessions: PomodoroSession[], start: Date): PomodoroSession[] => {
  const startStr = start.toISOString().split('T')[0];
  return sessions.filter(s => s.completed && s.date >= startStr);
};

/** Ardışık gün serisini hesaplar */
const calculateStreak = (sessions: PomodoroSession[]): number => {
  const sessionDates = new Set(sessions.filter(s => s.completed).map(s => s.date));
  if (sessionDates.size === 0) return 0;

  let streak = 0;
  const d = new Date();
  const today = d.toISOString().split('T')[0];

  // Bugün session yoksa dünden başla
  if (!sessionDates.has(today)) {
    d.setDate(d.getDate() - 1);
  }

  while (true) {
    const key = d.toISOString().split('T')[0];
    if (sessionDates.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

// --- Component ---
const Analytics: React.FC = () => {
  const { pomodoroSessions, tasks, lessons, pomodoroGoal, taskCategories } = useContext(DataContext);
  const [period, setPeriod] = useState<AnalyticsPeriod>('daily');

  const { start, days } = useMemo(() => getDateRange(period), [period]);

  // Seçili periyoda göre filtrelenmiş session'lar
  const filteredSessions = useMemo(
    () => filterSessionsByPeriod(pomodoroSessions, start),
    [pomodoroSessions, start]
  );

  // Günlük pomodoro verileri (grafik için)
  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string; pomodoros: number; focusMinutes: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      map.set(key, { date: key, pomodoros: 0, focusMinutes: 0 });
    }
    filteredSessions.forEach(s => {
      const entry = map.get(s.date);
      if (entry) {
        entry.pomodoros += 1;
        entry.focusMinutes += s.duration;
      }
    });
    return Array.from(map.values());
  }, [filteredSessions, start, days]);

  // Özet istatistikler — periyoda göre filtrelenmiş
  const summary = useMemo(() => {
    const totalPomodoros = filteredSessions.length;
    const totalFocusMinutes = filteredSessions.reduce((sum, s) => sum + s.duration, 0);
    const activeDays = new Set(filteredSessions.map(s => s.date)).size;
    const avgDailyPomodoros = activeDays > 0 ? Math.round((totalPomodoros / activeDays) * 10) / 10 : 0;
    const avgDailyMinutes = activeDays > 0 ? Math.round(totalFocusMinutes / activeDays) : 0;
    const streak = calculateStreak(pomodoroSessions);

    return {
      totalPomodoros,
      totalFocusMinutes,
      formattedFocusTime: formatDuration(totalFocusMinutes),
      activeDays,
      avgDailyPomodoros,
      avgDailyMinutes,
      formattedAvgDaily: formatDuration(avgDailyMinutes),
      streak,
    };
  }, [filteredSessions, pomodoroSessions]);

  // Tüm zamanların toplamı (summary kartı için)
  const allTimeSummary = useMemo(() => {
    const allCompleted = pomodoroSessions.filter(s => s.completed);
    const totalMinutes = allCompleted.reduce((sum, s) => sum + s.duration, 0);
    return {
      totalPomodoros: allCompleted.length,
      formattedFocusTime: formatDuration(totalMinutes),
    };
  }, [pomodoroSessions]);

  // Görev istatistikleri
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const byPriority = (['urgent', 'high', 'medium', 'low'] as const).map(p => {
      const all = tasks.filter(t => t.priority === p);
      const done = all.filter(t => t.completed).length;
      const remaining = all.length - done;
      return {
        name: { urgent: 'Acil', high: 'Yüksek', medium: 'Orta', low: 'Düşük' }[p],
        completed: done,
        remaining,
        total: all.length,
        rate: all.length > 0 ? Math.round((done / all.length) * 100) : 0,
      };
    });

    const byCategory = taskCategories.map(cat => {
      const all = tasks.filter(t => t.category === cat.id);
      const done = all.filter(t => t.completed).length;
      return { name: cat.name, color: cat.color, total: all.length, completed: done };
    });

    return { total, completed, pending, rate, byPriority, byCategory };
  }, [tasks, taskCategories]);

  const pieData = useMemo(() => [
    { name: 'Tamamlanan', value: taskStats.completed, color: '#10b981' },
    { name: 'Bekleyen', value: taskStats.pending, color: '#6b7280' },
  ], [taskStats]);

  const periodLabels: Record<AnalyticsPeriod, string> = {
    daily: 'Son 7 Gün',
    weekly: 'Son 4 Hafta',
    monthly: 'Son 3 Ay',
  };

  return (
    <motion.div className="space-y-6" variants={staggerContainer} initial="initial" animate="animate" exit="exit">
      <motion.div className="flex items-center justify-between flex-wrap gap-2" variants={staggerItem}>
        <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-400 dark:to-violet-300">
          İstatistikler
        </h1>
        <div className="flex space-x-2">
          {(['daily', 'weekly', 'monthly'] as AnalyticsPeriod[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${period === p ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-gray-500/10 dark:bg-white/5 hover:bg-gray-500/20'}`}>
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Summary Cards — periyoda göre filtrelenmiş */}
      <motion.div className="grid grid-cols-2 md:grid-cols-5 gap-4" variants={staggerItem}>
        <SummaryCard icon="Target" label={`Pomodoro (${periodLabels[period]})`} value={summary.totalPomodoros.toString()} color="text-primary" />
        <SummaryCard icon="BarChart" label={`Odaklanma (${periodLabels[period]})`} value={summary.formattedFocusTime} color="text-blue-500" />
        <SummaryCard icon="Calendar" label="Aktif Gün" value={`${summary.activeDays} gün`} color="text-violet-500" />
        <SummaryCard icon="CheckSquare" label="Görev Tamamlama" value={`%${taskStats.rate}`} color="text-green-500" />
        <SummaryCard icon="Award" label="Günlük Seri" value={`${summary.streak} gün`} color="text-yellow-500" />
      </motion.div>

      {/* Tüm zamanlar + Günlük ortalama */}
      <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4" variants={staggerItem}>
        <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl p-5 rounded-2xl shadow-lg border border-white/20 dark:border-white/10">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tüm Zamanlar</p>
          <p className="text-2xl font-bold">{allTimeSummary.totalPomodoros} pomodoro</p>
          <p className="text-sm text-gray-500">{allTimeSummary.formattedFocusTime} toplam odaklanma</p>
        </div>
        <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl p-5 rounded-2xl shadow-lg border border-white/20 dark:border-white/10">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Günlük Ortalama (aktif günler)</p>
          <p className="text-2xl font-bold">{summary.avgDailyPomodoros} pomodoro/gün</p>
          <p className="text-sm text-gray-500">{summary.formattedAvgDaily} / gün</p>
        </div>
        <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl p-5 rounded-2xl shadow-lg border border-white/20 dark:border-white/10">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Görev Özeti</p>
          <p className="text-2xl font-bold">{taskStats.completed}/{taskStats.total}</p>
          <p className="text-sm text-gray-500">{taskStats.pending} görev bekliyor</p>
        </div>
      </motion.div>

      {/* Hedef İlerleme */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" variants={staggerItem}>
        <GoalCard label="Günlük Hedef" completed={pomodoroGoal.dailyCompleted} target={pomodoroGoal.dailyTarget} color="bg-primary" />
        <GoalCard label="Haftalık Hedef" completed={pomodoroGoal.weeklyCompleted} target={pomodoroGoal.weeklyTarget} color="bg-violet-500" />
      </motion.div>

      {/* Odaklanma Trendi Grafiği */}
      <motion.div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-white/10" variants={staggerItem}>
        <h2 className="text-lg font-bold mb-4">Odaklanma Trendi — {periodLabels[period]}</h2>
        {dailyData.some(d => d.pomodoros > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorPomodoros" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" tickFormatter={(d) => formatDateLabel(d, period)} tick={{ fontSize: 11 }} stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(30,30,40,0.95)', border: 'none', borderRadius: '12px', color: '#fff' }}
                labelFormatter={(d) => {
                  const date = new Date(d + 'T00:00:00');
                  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'Pomodoro') return [`${value} pomodoro`, 'Pomodoro'];
                  return [formatDuration(value), 'Odaklanma'];
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="pomodoros" name="Pomodoro" stroke="#8b5cf6" fill="url(#colorPomodoros)" strokeWidth={2} />
              <Area type="monotone" dataKey="focusMinutes" name="Dakika" stroke="#3b82f6" fill="url(#colorMinutes)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">Bu dönemde veri yok</div>
        )}
      </motion.div>

      {/* Görev İstatistikleri */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" variants={staggerItem}>
        {/* Pie Chart */}
        <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-white/10">
          <h2 className="text-lg font-bold mb-4">Görev Tamamlama Oranı</h2>
          {taskStats.total > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value"
                  label={({ name, value, percent }) => `${name}: ${value} (%${(percent * 100).toFixed(0)})`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(30,30,40,0.95)', border: 'none', borderRadius: '12px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500">Henüz görev yok</div>
          )}
        </div>

        {/* Öncelik Bazında — stacked bar (tamamlanan + kalan = toplam) */}
        <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-white/10">
          <h2 className="text-lg font-bold mb-4">Öncelik Bazında Tamamlama</h2>
          {taskStats.byPriority.some(p => p.total > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={taskStats.byPriority} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 11 }} width={60} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(30,30,40,0.95)', border: 'none', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: number, name: string) => [`${value} görev`, name]} />
                <Legend />
                <Bar dataKey="completed" name="Tamamlanan" stackId="tasks" fill="#10b981" />
                <Bar dataKey="remaining" name="Kalan" stackId="tasks" fill="rgba(107,114,128,0.4)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500">Henüz görev yok</div>
          )}
        </div>
      </motion.div>

      {/* Ders İlerleme Özeti */}
      <motion.div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-white/10" variants={staggerItem}>
        <h2 className="text-lg font-bold mb-4">Ders İlerleme Özeti</h2>
        {lessons.length > 0 ? (
          <div className="space-y-4">
            {lessons.map(lesson => (
              <div key={lesson.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold truncate mr-4" title={lesson.title}>{lesson.title}</span>
                  <span className="text-sm text-gray-500 shrink-0">%{lesson.progress}</span>
                </div>
                <div className="w-full bg-gray-500/20 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full transition-all ${lesson.progress >= 100 ? 'bg-green-500' : lesson.progress >= 50 ? 'bg-blue-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, lesson.progress)}%` }} />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Toplam İlerleme</span>
                <span className="text-sm font-bold text-primary">
                  %{Math.round(lessons.reduce((sum, l) => sum + l.progress, 0) / lessons.length)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[100px] text-gray-500">Henüz ders eklenmemiş</div>
        )}
      </motion.div>

      {/* Kategori Bazında Görevler */}
      {taskStats.byCategory.some(c => c.total > 0) && (
        <motion.div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-white/10" variants={staggerItem}>
          <h2 className="text-lg font-bold mb-4">Kategori Bazında Görevler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {taskStats.byCategory.filter(c => c.total > 0).map(cat => (
              <div key={cat.name} className="p-4 rounded-xl bg-gray-500/5 dark:bg-white/5">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm font-semibold">{cat.name}</span>
                </div>
                <p className="text-2xl font-bold">{cat.completed}/{cat.total}</p>
                <p className="text-xs text-gray-500">%{Math.round((cat.completed / cat.total) * 100)} tamamlandı</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// --- Sub Components ---
const SummaryCard: React.FC<{ icon: string; label: string; value: string; color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl p-4 rounded-2xl shadow-lg border border-white/20 dark:border-white/10">
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded-lg bg-gray-500/10 ${color}`}>
        <Icon name={icon as any} className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  </div>
);

const GoalCard: React.FC<{ label: string; completed: number; target: number; color: string }> = ({ label, completed, target, color }) => {
  const pct = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0;
  return (
    <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl p-5 rounded-2xl shadow-lg border border-white/20 dark:border-white/10">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">{label}</h3>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold">{completed}/{target}</span>
        <span className="text-sm text-gray-500">%{pct}</span>
      </div>
      <div className="w-full bg-gray-500/20 rounded-full h-3">
        <div className={`${color} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default Analytics;
