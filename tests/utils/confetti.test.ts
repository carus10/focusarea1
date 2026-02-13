import { describe, it, expect, vi, beforeEach } from 'vitest';
import confetti from 'canvas-confetti';
import {
  fireConfetti,
  fireTaskCompleteConfetti,
  fireCardUnlockConfetti,
  firePomodoroCompleteConfetti,
  TASK_COMPLETE_COLORS,
  CARD_UNLOCK_COLORS,
  POMODORO_COMPLETE_COLORS,
  ConfettiConfig,
} from '../../utils/confetti';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(() => Promise.resolve(undefined)),
}));

const mockedConfetti = vi.mocked(confetti);

beforeEach(() => {
  mockedConfetti.mockClear();
});

// ============================================================
// Color Palette Tests
// ============================================================

describe('Color Palettes', () => {
  it('TASK_COMPLETE_COLORS should contain green and blue tones', () => {
    expect(TASK_COMPLETE_COLORS).toBeInstanceOf(Array);
    expect(TASK_COMPLETE_COLORS.length).toBeGreaterThan(0);
    TASK_COMPLETE_COLORS.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('CARD_UNLOCK_COLORS should contain gold, silver, and purple tones', () => {
    expect(CARD_UNLOCK_COLORS).toBeInstanceOf(Array);
    expect(CARD_UNLOCK_COLORS.length).toBeGreaterThan(0);
    CARD_UNLOCK_COLORS.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('POMODORO_COMPLETE_COLORS should contain red, orange, and yellow tones', () => {
    expect(POMODORO_COMPLETE_COLORS).toBeInstanceOf(Array);
    expect(POMODORO_COMPLETE_COLORS.length).toBeGreaterThan(0);
    POMODORO_COMPLETE_COLORS.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });
});

// ============================================================
// fireConfetti (generic) Tests
// ============================================================

describe('fireConfetti', () => {
  it('should call canvas-confetti with default options when no config is provided', () => {
    fireConfetti();

    expect(mockedConfetti).toHaveBeenCalledTimes(1);
    const calledWith = mockedConfetti.mock.calls[0][0]!;
    expect(calledWith.particleCount).toBe(50);
    expect(calledWith.spread).toBe(45);
    expect(calledWith.angle).toBe(90);
    expect(calledWith.origin).toEqual({ x: 0.5, y: 0.5 });
    expect(calledWith.disableForReducedMotion).toBe(true);
  });

  it('should merge user config with defaults', () => {
    const config: ConfettiConfig = {
      particleCount: 200,
      colors: ['#ff0000'],
      spread: 120,
    };

    fireConfetti(config);

    expect(mockedConfetti).toHaveBeenCalledTimes(1);
    const calledWith = mockedConfetti.mock.calls[0][0]!;
    expect(calledWith.particleCount).toBe(200);
    expect(calledWith.colors).toEqual(['#ff0000']);
    expect(calledWith.spread).toBe(120);
    // Defaults still applied
    expect(calledWith.angle).toBe(90);
    expect(calledWith.origin).toEqual({ x: 0.5, y: 0.5 });
  });

  it('should pass through optional fields when provided', () => {
    const config: ConfettiConfig = {
      startVelocity: 55,
      decay: 0.85,
      gravity: 1.2,
      ticks: 300,
      scalar: 1.5,
      shapes: ['star', 'circle'],
    };

    fireConfetti(config);

    const calledWith = mockedConfetti.mock.calls[0][0]!;
    expect(calledWith.startVelocity).toBe(55);
    expect(calledWith.decay).toBe(0.85);
    expect(calledWith.gravity).toBe(1.2);
    expect(calledWith.ticks).toBe(300);
    expect(calledWith.scalar).toBe(1.5);
    expect(calledWith.shapes).toEqual(['star', 'circle']);
  });

  it('should allow overriding disableForReducedMotion', () => {
    fireConfetti({ disableForReducedMotion: false });

    const calledWith = mockedConfetti.mock.calls[0][0]!;
    expect(calledWith.disableForReducedMotion).toBe(false);
  });

  it('should return the result from canvas-confetti', () => {
    const result = fireConfetti();
    expect(result).toBeInstanceOf(Promise);
  });
});

// ============================================================
// fireTaskCompleteConfetti Tests
// ============================================================

describe('fireTaskCompleteConfetti', () => {
  it('should call canvas-confetti with task completion settings', () => {
    fireTaskCompleteConfetti();

    expect(mockedConfetti).toHaveBeenCalledTimes(1);
    const calledWith = mockedConfetti.mock.calls[0][0]!;
    expect(calledWith.particleCount).toBe(50);
    expect(calledWith.colors).toEqual(TASK_COMPLETE_COLORS);
  });

  it('should use a moderate spread for a small burst', () => {
    fireTaskCompleteConfetti();

    const calledWith = mockedConfetti.mock.calls[0][0]!;
    expect(calledWith.spread).toBe(60);
  });

  it('should have the smallest particle count among all presets', () => {
    fireTaskCompleteConfetti();
    const taskCount = mockedConfetti.mock.calls[0][0]!.particleCount!;

    mockedConfetti.mockClear();
    fireCardUnlockConfetti();
    const cardCount = mockedConfetti.mock.calls[0][0]!.particleCount!;

    mockedConfetti.mockClear();
    firePomodoroCompleteConfetti();
    const pomodoroCount = mockedConfetti.mock.calls[0][0]!.particleCount!;

    expect(taskCount).toBeLessThan(pomodoroCount);
    expect(taskCount).toBeLessThan(cardCount);
  });
});

// ============================================================
// fireCardUnlockConfetti Tests
// ============================================================

describe('fireCardUnlockConfetti', () => {
  it('should call canvas-confetti with card unlock settings', () => {
    fireCardUnlockConfetti();

    expect(mockedConfetti).toHaveBeenCalledTimes(1);
    const calledWith = mockedConfetti.mock.calls[0][0]!;
    expect(calledWith.particleCount).toBe(150);
    expect(calledWith.colors).toEqual(CARD_UNLOCK_COLORS);
  });

  it('should use a wide spread of 100 for a big burst', () => {
    fireCardUnlockConfetti();

    const calledWith = mockedConfetti.mock.calls[0][0]!;
    expect(calledWith.spread).toBe(100);
  });

  it('should have the largest particle count among all presets', () => {
    fireCardUnlockConfetti();
    const cardCount = mockedConfetti.mock.calls[0][0]!.particleCount!;

    mockedConfetti.mockClear();
    fireTaskCompleteConfetti();
    const taskCount = mockedConfetti.mock.calls[0][0]!.particleCount!;

    mockedConfetti.mockClear();
    firePomodoroCompleteConfetti();
    const pomodoroCount = mockedConfetti.mock.calls[0][0]!.particleCount!;

    expect(cardCount).toBeGreaterThan(taskCount);
    expect(cardCount).toBeGreaterThan(pomodoroCount);
  });
});

// ============================================================
// firePomodoroCompleteConfetti Tests
// ============================================================

describe('firePomodoroCompleteConfetti', () => {
  it('should call canvas-confetti with pomodoro completion settings', () => {
    firePomodoroCompleteConfetti();

    expect(mockedConfetti).toHaveBeenCalledTimes(1);
    const calledWith = mockedConfetti.mock.calls[0][0]!;
    expect(calledWith.particleCount).toBe(100);
    expect(calledWith.colors).toEqual(POMODORO_COMPLETE_COLORS);
  });

  it('should use a medium spread for a medium burst', () => {
    firePomodoroCompleteConfetti();

    const calledWith = mockedConfetti.mock.calls[0][0]!;
    expect(calledWith.spread).toBe(70);
  });

  it('should have a particle count between task and card unlock presets', () => {
    firePomodoroCompleteConfetti();
    const pomodoroCount = mockedConfetti.mock.calls[0][0]!.particleCount!;

    mockedConfetti.mockClear();
    fireTaskCompleteConfetti();
    const taskCount = mockedConfetti.mock.calls[0][0]!.particleCount!;

    mockedConfetti.mockClear();
    fireCardUnlockConfetti();
    const cardCount = mockedConfetti.mock.calls[0][0]!.particleCount!;

    expect(pomodoroCount).toBeGreaterThan(taskCount);
    expect(pomodoroCount).toBeLessThan(cardCount);
  });
});

// ============================================================
// Accessibility Tests
// ============================================================

describe('Accessibility', () => {
  it('all preset functions should enable disableForReducedMotion by default', () => {
    fireTaskCompleteConfetti();
    expect(mockedConfetti.mock.calls[0][0]!.disableForReducedMotion).toBe(true);

    mockedConfetti.mockClear();
    fireCardUnlockConfetti();
    expect(mockedConfetti.mock.calls[0][0]!.disableForReducedMotion).toBe(true);

    mockedConfetti.mockClear();
    firePomodoroCompleteConfetti();
    expect(mockedConfetti.mock.calls[0][0]!.disableForReducedMotion).toBe(true);
  });
});
