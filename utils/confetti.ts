import confetti from 'canvas-confetti';
import type { Options } from 'canvas-confetti';

// ============================================================
// Confetti Configuration Types
// ============================================================

export interface ConfettiConfig {
  /** Number of confetti particles to launch */
  particleCount?: number;
  /** How far off center the confetti can go, in degrees */
  spread?: number;
  /** The angle in which to launch the confetti, in degrees (90 = straight up) */
  angle?: number;
  /** Where to start firing confetti from (0–1 for both x and y) */
  origin?: { x?: number; y?: number };
  /** Array of HEX color strings */
  colors?: string[];
  /** How fast the confetti will start going, in pixels */
  startVelocity?: number;
  /** How quickly the confetti will lose speed (0–1) */
  decay?: number;
  /** How quickly the particles are pulled down (1 = full gravity) */
  gravity?: number;
  /** How many times the confetti will move before disappearing */
  ticks?: number;
  /** Scale factor for each confetti particle */
  scalar?: number;
  /** Possible shapes: 'square', 'circle', 'star' */
  shapes?: ('square' | 'circle' | 'star')[];
  /** Disables confetti for users that prefer reduced motion */
  disableForReducedMotion?: boolean;
}

// ============================================================
// Preset Color Palettes
// ============================================================

/** Green and blue tones for task completion */
export const TASK_COMPLETE_COLORS = ['#22c55e', '#16a34a', '#3b82f6', '#2563eb', '#10b981'];

/** Gold, silver, and purple tones for card unlock */
export const CARD_UNLOCK_COLORS = ['#fbbf24', '#f59e0b', '#c0c0c0', '#a3a3a3', '#a855f7', '#7c3aed'];

/** Red, orange, and yellow tones (tomato theme) for pomodoro completion */
export const POMODORO_COMPLETE_COLORS = ['#ef4444', '#dc2626', '#f97316', '#ea580c', '#eab308', '#facc15'];

// ============================================================
// Confetti Functions
// ============================================================

/**
 * Generic confetti function. Fires confetti with the given options.
 * Merges user-provided config with sensible defaults.
 */
export function fireConfetti(config: ConfettiConfig = {}): Promise<undefined> | null {
  const options: Options = {
    particleCount: config.particleCount ?? 50,
    spread: config.spread ?? 45,
    angle: config.angle ?? 90,
    origin: config.origin ?? { x: 0.5, y: 0.5 },
    colors: config.colors,
    startVelocity: config.startVelocity,
    decay: config.decay,
    gravity: config.gravity,
    ticks: config.ticks,
    scalar: config.scalar,
    shapes: config.shapes,
    disableForReducedMotion: config.disableForReducedMotion ?? true,
  };

  return confetti(options);
}

/**
 * Small burst for task completion.
 * 50 particles, green/blue colors, moderate spread.
 */
export function fireTaskCompleteConfetti(): Promise<undefined> | null {
  return fireConfetti({
    particleCount: 50,
    spread: 60,
    origin: { x: 0.5, y: 0.6 },
    colors: TASK_COMPLETE_COLORS,
    startVelocity: 30,
    gravity: 1,
    ticks: 150,
    scalar: 0.9,
  });
}

/**
 * Big burst for card unlock.
 * 150 particles, gold/silver/purple colors, wide spread.
 */
export function fireCardUnlockConfetti(): Promise<undefined> | null {
  return fireConfetti({
    particleCount: 150,
    spread: 100,
    origin: { x: 0.5, y: 0.5 },
    colors: CARD_UNLOCK_COLORS,
    startVelocity: 45,
    gravity: 0.8,
    ticks: 250,
    scalar: 1.1,
  });
}

/**
 * Medium burst for pomodoro completion.
 * 100 particles, red/orange/yellow (tomato theme) colors.
 */
export function firePomodoroCompleteConfetti(): Promise<undefined> | null {
  return fireConfetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0.5, y: 0.5 },
    colors: POMODORO_COMPLETE_COLORS,
    startVelocity: 40,
    gravity: 0.9,
    ticks: 200,
    scalar: 1,
  });
}
