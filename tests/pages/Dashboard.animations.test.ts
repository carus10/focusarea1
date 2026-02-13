import { describe, it, expect } from 'vitest';
import { staggerContainer, staggerItem } from '../../utils/animations';

/**
 * Tests for Dashboard widget loading animation integration.
 *
 * Dashboard uses staggerContainer on the parent motion.div and
 * staggerItem on each child (heading, widget containers) to create
 * a sequential loading animation effect.
 */
describe('Dashboard Widget Loading Animations', () => {
  describe('staggerContainer variant used by Dashboard parent', () => {
    it('should have initial, animate, and exit states for orchestrating children', () => {
      expect(staggerContainer).toHaveProperty('initial');
      expect(staggerContainer).toHaveProperty('animate');
      expect(staggerContainer).toHaveProperty('exit');
    });

    it('should stagger children with 0.1s delay between each', () => {
      const animate = staggerContainer.animate as Record<string, any>;
      expect(animate.transition.staggerChildren).toBe(0.1);
    });

    it('should have a small initial delay before first child animates', () => {
      const animate = staggerContainer.animate as Record<string, any>;
      expect(animate.transition.delayChildren).toBe(0.05);
    });

    it('should reverse stagger direction on exit', () => {
      const exit = staggerContainer.exit as Record<string, any>;
      expect(exit.transition.staggerDirection).toBe(-1);
    });
  });

  describe('staggerItem variant used by Dashboard widgets', () => {
    it('should have initial, animate, and exit states', () => {
      expect(staggerItem).toHaveProperty('initial');
      expect(staggerItem).toHaveProperty('animate');
      expect(staggerItem).toHaveProperty('exit');
    });

    it('should start offset below (y: 20) with opacity 0', () => {
      expect(staggerItem.initial).toEqual({ y: 20, opacity: 0 });
    });

    it('should animate to final position (y: 0) with full opacity', () => {
      const animate = staggerItem.animate as Record<string, any>;
      expect(animate.y).toBe(0);
      expect(animate.opacity).toBe(1);
    });

    it('should use 300ms easeOut transition for smooth widget appearance', () => {
      const animate = staggerItem.animate as Record<string, any>;
      expect(animate.transition.duration).toBe(0.3);
      expect(animate.transition.ease).toBe('easeOut');
    });

    it('should exit with downward motion and fade out', () => {
      const exit = staggerItem.exit as Record<string, any>;
      expect(exit.y).toBe(20);
      expect(exit.opacity).toBe(0);
    });
  });
});
