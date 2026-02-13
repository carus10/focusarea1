import { describe, it, expect } from 'vitest';

/**
 * PomodoroHistory component – logic-level unit tests.
 *
 * The vitest environment is "node" (no DOM), so we test the component's
 * logic by importing the module and verifying:
 *   - exported interface / default export shape
 *   - source-level checks for correct Recharts usage
 *   - period selector configuration
 *   - Turkish UI labels
 *   - correct data flow from pomodoroStats utilities
 */

// ============================================================
// 1. Module & Export Tests
// ============================================================

describe('PomodoroHistory module exports', () => {
  it('should export a default React component', async () => {
    const mod = await import('../../components/PomodoroHistory');
    expect(mod.default).toBeDefined();
    // React.memo wraps the component, so it's an object with $$typeof
    expect(typeof mod.default === 'function' || typeof mod.default === 'object').toBe(true);
  });

  it('should be a named function component called PomodoroHistory', async () => {
    const mod = await import('../../components/PomodoroHistory');
    // React.memo wraps the component; the inner type holds the original name
    const inner = (mod.default as any).type ?? mod.default;
    expect(inner.name).toBe('PomodoroHistory');
  });
});

// ============================================================
// 2. Recharts Integration
// ============================================================

describe('Recharts chart configuration', () => {
  it('should import BarChart from recharts', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('BarChart');
    expect(source).toContain('from \'recharts\'');
  });

  it('should import Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('Bar,');
    expect(source).toContain('XAxis');
    expect(source).toContain('YAxis');
    expect(source).toContain('Tooltip');
    expect(source).toContain('ResponsiveContainer');
    expect(source).toContain('Cell');
  });

  it('should use gradient fills for bars (matching PomodoroWidget style)', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('linearGradient');
    expect(source).toContain('rgba(123, 92, 255');
  });

  it('should define a highlight gradient for the max bar', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('histBarGradientHighlight');
  });

  it('should use rounded bar corners', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('radius={[4, 4, 0, 0]}');
  });

  it('should hide axis lines and tick lines', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('axisLine={false}');
    expect(source).toContain('tickLine={false}');
  });
});

// ============================================================
// 3. Period Selector
// ============================================================

describe('Period selector tabs', () => {
  it('should have three period options: daily, weekly, monthly', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain("key: 'daily'");
    expect(source).toContain("key: 'weekly'");
    expect(source).toContain("key: 'monthly'");
  });

  it('should use Turkish labels: Günlük, Haftalık, Aylık', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain("label: 'Günlük'");
    expect(source).toContain("label: 'Haftalık'");
    expect(source).toContain("label: 'Aylık'");
  });

  it('should default to daily period', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain("useState<AnalyticsPeriod>('daily')");
  });

  it('should use pill-style buttons with active state using bg-primary', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('bg-primary text-white');
  });
});

// ============================================================
// 4. Data Flow from pomodoroStats
// ============================================================

describe('Data flow from pomodoroStats utilities', () => {
  it('should import getDailyStats, getWeeklyStats, getMonthlyStats', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('getDailyStats');
    expect(source).toContain('getWeeklyStats');
    expect(source).toContain('getMonthlyStats');
    expect(source).toContain("from '../utils/pomodoroStats'");
  });

  it('should call getDailyStats with 7 days for daily period', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('getDailyStats(pomodoroSessions, 7)');
  });

  it('should call getWeeklyStats with 4 weeks for weekly period', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('getWeeklyStats(pomodoroSessions, 4)');
  });

  it('should call getMonthlyStats with 6 months for monthly period', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('getMonthlyStats(pomodoroSessions, 6)');
  });

  it('should use useMemo for chart data computation', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('useMemo');
    expect(source).toContain('[pomodoroSessions, period]');
  });
});

// ============================================================
// 5. X-Axis Data Key Mapping
// ============================================================

describe('X-axis data key mapping per period', () => {
  it('should use "label" for daily period', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain("case 'daily':");
    expect(source).toContain("return 'label'");
  });

  it('should use "weekLabel" for weekly period', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain("case 'weekly':");
    expect(source).toContain("return 'weekLabel'");
  });

  it('should use "monthLabel" for monthly period', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain("case 'monthly':");
    expect(source).toContain("return 'monthLabel'");
  });
});

// ============================================================
// 6. Summary Stats
// ============================================================

describe('Summary statistics display', () => {
  it('should compute totalCount and totalMinutes from chart data', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('totalCount');
    expect(source).toContain('totalMinutes');
  });

  it('should display "Toplam Pomodoro" label', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('Toplam Pomodoro');
  });

  it('should display "Toplam Dakika" label', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('Toplam Dakika');
  });

  it('should use text-primary color for stat values', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('text-primary');
  });
});

// ============================================================
// 7. Card Styling
// ============================================================

describe('Card styling', () => {
  it('should use the standard card background classes', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('bg-light-card/60');
    expect(source).toContain('dark:bg-dark-card/50');
  });

  it('should use backdrop blur and rounded corners', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('backdrop-blur-2xl');
    expect(source).toContain('rounded-2xl');
  });

  it('should have border styling matching other cards', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('border-white/20');
    expect(source).toContain('dark:border-white/10');
  });
});

// ============================================================
// 8. Custom Tooltip
// ============================================================

describe('Custom tooltip', () => {
  it('should have a custom tooltip component', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('CustomTooltip');
  });

  it('should display pomodoro count and minutes in tooltip', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('pomodoro');
    expect(source).toContain('dk');
  });

  it('should use dark tooltip styling matching PomodoroWidget', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('rgba(30,30,30,0.8)');
    expect(source).toContain('blur(10px)');
  });
});

// ============================================================
// 9. Context Integration
// ============================================================

describe('DataContext integration', () => {
  it('should import DataContext', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain("import { DataContext } from '../context/DataContext'");
  });

  it('should use pomodoroSessions from context', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('const { pomodoroSessions } = useContext(DataContext)');
  });

  it('should import AnalyticsPeriod type', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('AnalyticsPeriod');
    expect(source).toContain("from '../types'");
  });
});

// ============================================================
// 10. Header
// ============================================================

describe('Component header', () => {
  it('should display "Pomodoro Geçmişi" as the title', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/PomodoroHistory.tsx', 'utf-8');
    expect(source).toContain('Pomodoro Geçmişi');
  });
});
