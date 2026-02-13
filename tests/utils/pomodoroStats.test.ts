import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PomodoroSession } from '../../types';
import {
  formatDateString,
  getTodayDateString,
  getSessionsForDate,
  getTodaySessions,
  getWeekSessions,
  getMonthSessions,
  getTotalPomodoroCount,
  getTotalFocusMinutes,
  getDailyStats,
  getWeeklyStats,
  getMonthlyStats,
  getHourlyStats,
} from '../../utils/pomodoroStats';

// ============================================================
// Helpers
// ============================================================

function makeSession(
  overrides: Partial<PomodoroSession> = {},
): PomodoroSession {
  return {
    id: overrides.id ?? 'sess-1',
    date: overrides.date ?? '2024-06-15',
    duration: overrides.duration ?? 25,
    completed: overrides.completed ?? true,
  };
}

/**
 * Build a batch of sessions for a given date.
 */
function makeSessions(
  date: string,
  count: number,
  duration = 25,
  completed = true,
): PomodoroSession[] {
  return Array.from({ length: count }, (_, i) =>
    makeSession({ id: `${date}-${i}`, date, duration, completed }),
  );
}

// ============================================================
// Tests
// ============================================================

describe('pomodoroStats', () => {
  // ----------------------------------------------------------
  // formatDateString
  // ----------------------------------------------------------
  describe('formatDateString', () => {
    it('should format a date as YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 5); // Jan 5, 2024
      expect(formatDateString(date)).toBe('2024-01-05');
    });

    it('should zero-pad single-digit months and days', () => {
      const date = new Date(2024, 2, 9); // Mar 9, 2024
      expect(formatDateString(date)).toBe('2024-03-09');
    });
  });

  // ----------------------------------------------------------
  // getTodayDateString
  // ----------------------------------------------------------
  describe('getTodayDateString', () => {
    it('should return today in YYYY-MM-DD format', () => {
      const result = getTodayDateString();
      // Verify format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // Verify it matches the current date
      const now = new Date();
      const expected = formatDateString(now);
      expect(result).toBe(expected);
    });
  });

  // ----------------------------------------------------------
  // getSessionsForDate
  // ----------------------------------------------------------
  describe('getSessionsForDate', () => {
    it('should return only completed sessions for the given date', () => {
      const sessions: PomodoroSession[] = [
        makeSession({ id: '1', date: '2024-06-15', completed: true }),
        makeSession({ id: '2', date: '2024-06-15', completed: false }),
        makeSession({ id: '3', date: '2024-06-16', completed: true }),
      ];

      const result = getSessionsForDate(sessions, '2024-06-15');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should return empty array when no sessions match', () => {
      const sessions = [makeSession({ date: '2024-06-15' })];
      expect(getSessionsForDate(sessions, '2024-01-01')).toEqual([]);
    });

    it('should return empty array for empty sessions', () => {
      expect(getSessionsForDate([], '2024-06-15')).toEqual([]);
    });
  });

  // ----------------------------------------------------------
  // getTodaySessions
  // ----------------------------------------------------------
  describe('getTodaySessions', () => {
    it('should return completed sessions for today', () => {
      const today = getTodayDateString();
      const sessions: PomodoroSession[] = [
        makeSession({ id: '1', date: today, completed: true }),
        makeSession({ id: '2', date: today, completed: false }),
        makeSession({ id: '3', date: '2020-01-01', completed: true }),
      ];

      const result = getTodaySessions(sessions);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  // ----------------------------------------------------------
  // getWeekSessions
  // ----------------------------------------------------------
  describe('getWeekSessions', () => {
    it('should return completed sessions within the current week (Sun–Sat)', () => {
      const today = new Date();
      const dayOfWeek = today.getDay();

      // Create a session for each day of the current week
      const sessions: PomodoroSession[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - dayOfWeek + i);
        sessions.push(
          makeSession({ id: `week-${i}`, date: formatDateString(d) }),
        );
      }

      // Add a session from last week
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      sessions.push(
        makeSession({ id: 'old', date: formatDateString(lastWeek) }),
      );

      const result = getWeekSessions(sessions);
      expect(result).toHaveLength(7);
      expect(result.find((s) => s.id === 'old')).toBeUndefined();
    });
  });

  // ----------------------------------------------------------
  // getMonthSessions
  // ----------------------------------------------------------
  describe('getMonthSessions', () => {
    it('should return completed sessions within the current month', () => {
      const today = new Date();
      const y = today.getFullYear();
      const m = today.getMonth();

      const firstDay = formatDateString(new Date(y, m, 1));
      const lastDay = formatDateString(new Date(y, m + 1, 0));

      const sessions: PomodoroSession[] = [
        makeSession({ id: 'first', date: firstDay }),
        makeSession({ id: 'last', date: lastDay }),
        makeSession({ id: 'outside', date: formatDateString(new Date(y, m - 1, 15)) }),
      ];

      const result = getMonthSessions(sessions);
      expect(result).toHaveLength(2);
      expect(result.map((s) => s.id).sort()).toEqual(['first', 'last']);
    });
  });

  // ----------------------------------------------------------
  // getTotalPomodoroCount
  // ----------------------------------------------------------
  describe('getTotalPomodoroCount', () => {
    it('should count only completed sessions', () => {
      const sessions: PomodoroSession[] = [
        makeSession({ completed: true }),
        makeSession({ completed: true }),
        makeSession({ completed: false }),
      ];
      expect(getTotalPomodoroCount(sessions)).toBe(2);
    });

    it('should return 0 for empty array', () => {
      expect(getTotalPomodoroCount([])).toBe(0);
    });
  });

  // ----------------------------------------------------------
  // getTotalFocusMinutes
  // ----------------------------------------------------------
  describe('getTotalFocusMinutes', () => {
    it('should sum durations of completed sessions only', () => {
      const sessions: PomodoroSession[] = [
        makeSession({ duration: 25, completed: true }),
        makeSession({ duration: 50, completed: true }),
        makeSession({ duration: 100, completed: false }),
      ];
      expect(getTotalFocusMinutes(sessions)).toBe(75);
    });

    it('should return 0 for empty array', () => {
      expect(getTotalFocusMinutes([])).toBe(0);
    });
  });

  // ----------------------------------------------------------
  // getDailyStats
  // ----------------------------------------------------------
  describe('getDailyStats', () => {
    it('should return stats for the last N days', () => {
      const result = getDailyStats([], 7);
      expect(result).toHaveLength(7);
    });

    it('should return entries ordered from oldest to newest', () => {
      const result = getDailyStats([], 3);
      expect(result[0].date < result[1].date).toBe(true);
      expect(result[1].date < result[2].date).toBe(true);
    });

    it('should include Turkish day labels', () => {
      const result = getDailyStats([], 1);
      // Label format: "DayName DayNumber"
      expect(result[0].label).toMatch(/^(Paz|Pzt|Sal|Çar|Per|Cum|Cmt) \d+$/);
    });

    it('should correctly aggregate session counts and minutes', () => {
      const today = getTodayDateString();
      const sessions = makeSessions(today, 3, 25);

      const result = getDailyStats(sessions, 1);
      expect(result[0].count).toBe(3);
      expect(result[0].minutes).toBe(75);
    });

    it('should show 0 for days with no sessions', () => {
      const result = getDailyStats([], 5);
      result.forEach((stat) => {
        expect(stat.count).toBe(0);
        expect(stat.minutes).toBe(0);
      });
    });
  });

  // ----------------------------------------------------------
  // getWeeklyStats
  // ----------------------------------------------------------
  describe('getWeeklyStats', () => {
    it('should return stats for the last N weeks', () => {
      const result = getWeeklyStats([], 4);
      expect(result).toHaveLength(4);
    });

    it('should include Turkish month names in labels', () => {
      const result = getWeeklyStats([], 1);
      // Label should contain Turkish month abbreviation
      const turkishMonths = [
        'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
        'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
      ];
      const hasMonth = turkishMonths.some((m) =>
        result[0].weekLabel.includes(m),
      );
      expect(hasMonth).toBe(true);
    });

    it('should aggregate sessions within each week', () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      // Create sessions for the start of the current week
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - dayOfWeek);
      const dateStr = formatDateString(weekStart);

      const sessions = makeSessions(dateStr, 5, 30);
      const result = getWeeklyStats(sessions, 1);

      expect(result[0].count).toBe(5);
      expect(result[0].minutes).toBe(150);
    });
  });

  // ----------------------------------------------------------
  // getMonthlyStats
  // ----------------------------------------------------------
  describe('getMonthlyStats', () => {
    it('should return stats for the last N months', () => {
      const result = getMonthlyStats([], 6);
      expect(result).toHaveLength(6);
    });

    it('should include Turkish month name and year in labels', () => {
      const result = getMonthlyStats([], 1);
      // e.g. "Haz 2024"
      expect(result[0].monthLabel).toMatch(
        /^(Oca|Şub|Mar|Nis|May|Haz|Tem|Ağu|Eyl|Eki|Kas|Ara) \d{4}$/,
      );
    });

    it('should aggregate sessions within each month', () => {
      const today = new Date();
      const y = today.getFullYear();
      const m = today.getMonth();
      const dateStr = formatDateString(new Date(y, m, 10));

      const sessions = makeSessions(dateStr, 4, 45);
      const result = getMonthlyStats(sessions, 1);

      expect(result[0].count).toBe(4);
      expect(result[0].minutes).toBe(180);
    });
  });

  // ----------------------------------------------------------
  // getHourlyStats
  // ----------------------------------------------------------
  describe('getHourlyStats', () => {
    it('should return 24 entries (one per hour)', () => {
      const result = getHourlyStats([]);
      expect(result).toHaveLength(24);
    });

    it('should have hours 0 through 23', () => {
      const result = getHourlyStats([]);
      const hours = result.map((h) => h.hour);
      expect(hours).toEqual(Array.from({ length: 24 }, (_, i) => i));
    });

    it('should distribute counts to working hours (9–17) when sessions exist', () => {
      const sessions = makeSessions('2024-06-15', 9, 25);
      const result = getHourlyStats(sessions);

      // Working hours should have counts
      for (let h = 9; h <= 17; h++) {
        expect(result[h].count).toBeGreaterThan(0);
      }

      // Non-working hours should be 0
      for (let h = 0; h < 9; h++) {
        expect(result[h].count).toBe(0);
      }
      for (let h = 18; h < 24; h++) {
        expect(result[h].count).toBe(0);
      }
    });

    it('should return all zeros when no sessions exist', () => {
      const result = getHourlyStats([]);
      result.forEach((stat) => {
        expect(stat.count).toBe(0);
        expect(stat.minutes).toBe(0);
      });
    });
  });
});
