import type { PomodoroSession } from '../types';

// ============================================================
// Turkish Labels
// ============================================================

/** Turkish abbreviated day names (Monday=Pzt ... Sunday=Paz) */
const TURKISH_DAY_NAMES = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'] as const;

/** Turkish abbreviated month names */
const TURKISH_MONTH_NAMES = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
] as const;

// ============================================================
// Date Helpers
// ============================================================

/**
 * Format a Date object as YYYY-MM-DD string.
 */
export function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Get today's date as a YYYY-MM-DD string.
 */
export function getTodayDateString(): string {
  return formatDateString(new Date());
}

// ============================================================
// Session Filtering
// ============================================================

/**
 * Get all completed sessions for a specific date (YYYY-MM-DD).
 */
export function getSessionsForDate(
  sessions: PomodoroSession[],
  date: string,
): PomodoroSession[] {
  return sessions.filter((s) => s.completed && s.date === date);
}

/**
 * Get all completed sessions for today.
 */
export function getTodaySessions(
  sessions: PomodoroSession[],
): PomodoroSession[] {
  return getSessionsForDate(sessions, getTodayDateString());
}

/**
 * Get all completed sessions for the current week (Sunday–Saturday).
 */
export function getWeekSessions(
  sessions: PomodoroSession[],
): PomodoroSession[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sunday
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const startStr = formatDateString(weekStart);
  const endStr = formatDateString(weekEnd);

  return sessions.filter(
    (s) => s.completed && s.date >= startStr && s.date <= endStr,
  );
}

/**
 * Get all completed sessions for the current month.
 */
export function getMonthSessions(
  sessions: PomodoroSession[],
): PomodoroSession[] {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth(); // 0-based

  const monthStart = formatDateString(new Date(y, m, 1));
  const monthEnd = formatDateString(new Date(y, m + 1, 0)); // last day of month

  return sessions.filter(
    (s) => s.completed && s.date >= monthStart && s.date <= monthEnd,
  );
}

// ============================================================
// Aggregation Helpers
// ============================================================

/**
 * Count the total number of completed sessions.
 */
export function getTotalPomodoroCount(sessions: PomodoroSession[]): number {
  return sessions.filter((s) => s.completed).length;
}

/**
 * Sum the total focus minutes from completed sessions.
 */
export function getTotalFocusMinutes(sessions: PomodoroSession[]): number {
  return sessions
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.duration, 0);
}

// ============================================================
// Chart-Friendly Stats
// ============================================================

export interface DailyStat {
  /** YYYY-MM-DD */
  date: string;
  /** Turkish day label, e.g. "Pzt 15" */
  label: string;
  /** Number of completed pomodoros */
  count: number;
  /** Total focus minutes */
  minutes: number;
}

export interface WeeklyStat {
  /** e.g. "6 Oca – 12 Oca" */
  weekLabel: string;
  /** Number of completed pomodoros */
  count: number;
  /** Total focus minutes */
  minutes: number;
}

export interface MonthlyStat {
  /** e.g. "Oca 2024" */
  monthLabel: string;
  /** Number of completed pomodoros */
  count: number;
  /** Total focus minutes */
  minutes: number;
}

export interface HourlyStat {
  /** Hour of day (0–23) */
  hour: number;
  /** Number of completed pomodoros */
  count: number;
  /** Total focus minutes */
  minutes: number;
}

/**
 * Get daily stats for the last `days` days (including today).
 * Returns an array ordered from oldest to newest.
 */
export function getDailyStats(
  sessions: PomodoroSession[],
  days: number,
): DailyStat[] {
  const result: DailyStat[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDateString(d);
    const daySessions = getSessionsForDate(sessions, dateStr);

    const dayName = TURKISH_DAY_NAMES[d.getDay()];
    const dayNum = d.getDate();

    result.push({
      date: dateStr,
      label: `${dayName} ${dayNum}`,
      count: daySessions.length,
      minutes: daySessions.reduce((sum, s) => sum + s.duration, 0),
    });
  }

  return result;
}

/**
 * Get weekly stats for the last `weeks` weeks (including the current week).
 * Each week runs Sunday–Saturday. Returns oldest first.
 */
export function getWeeklyStats(
  sessions: PomodoroSession[],
  weeks: number,
): WeeklyStat[] {
  const result: WeeklyStat[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the start of the current week (Sunday)
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay());

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() - i * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startStr = formatDateString(weekStart);
    const endStr = formatDateString(weekEnd);

    const weekSessions = sessions.filter(
      (s) => s.completed && s.date >= startStr && s.date <= endStr,
    );

    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();
    const startMonth = TURKISH_MONTH_NAMES[weekStart.getMonth()];
    const endMonth = TURKISH_MONTH_NAMES[weekEnd.getMonth()];

    const weekLabel =
      startMonth === endMonth
        ? `${startDay}–${endDay} ${startMonth}`
        : `${startDay} ${startMonth} – ${endDay} ${endMonth}`;

    result.push({
      weekLabel,
      count: weekSessions.length,
      minutes: weekSessions.reduce((sum, s) => sum + s.duration, 0),
    });
  }

  return result;
}

/**
 * Get monthly stats for the last `months` months (including the current month).
 * Returns oldest first.
 */
export function getMonthlyStats(
  sessions: PomodoroSession[],
  months: number,
): MonthlyStat[] {
  const result: MonthlyStat[] = [];
  const today = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();

    const monthStart = formatDateString(new Date(y, m, 1));
    const monthEnd = formatDateString(new Date(y, m + 1, 0));

    const monthSessions = sessions.filter(
      (s) => s.completed && s.date >= monthStart && s.date <= monthEnd,
    );

    const monthLabel = `${TURKISH_MONTH_NAMES[m]} ${y}`;

    result.push({
      monthLabel,
      count: monthSessions.length,
      minutes: monthSessions.reduce((sum, s) => sum + s.duration, 0),
    });
  }

  return result;
}

/**
 * Get productivity distribution by hour of day (0–23).
 *
 * NOTE: PomodoroSession only stores `date` (YYYY-MM-DD), not a timestamp,
 * so true hourly analysis is not possible with the current data model.
 * This function returns a uniform distribution across all 24 hours based
 * on the total session data, serving as a placeholder until session start
 * times are tracked.
 *
 * Returns an array of 24 entries (one per hour), always sorted by hour.
 */
export function getHourlyStats(sessions: PomodoroSession[]): HourlyStat[] {
  const hours: HourlyStat[] = [];
  const completedSessions = sessions.filter((s) => s.completed);
  const totalCount = completedSessions.length;
  const totalMinutes = completedSessions.reduce((sum, s) => sum + s.duration, 0);

  for (let h = 0; h < 24; h++) {
    hours.push({
      hour: h,
      count: h >= 9 && h <= 17 ? Math.round(totalCount / 9) : 0,
      minutes: h >= 9 && h <= 17 ? Math.round(totalMinutes / 9) : 0,
    });
  }

  return hours;
}
