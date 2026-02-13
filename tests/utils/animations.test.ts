import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TRANSITION,
  SPRING_TRANSITION,
  fadeIn,
  slideInLeft,
  slideInRight,
  slideInUp,
  scaleIn,
  staggerContainer,
  staggerItem,
  flipCard,
} from '../../utils/animations';

describe('Animation Constants', () => {
  describe('DEFAULT_TRANSITION', () => {
    it('should have 300ms duration', () => {
      expect(DEFAULT_TRANSITION).toHaveProperty('duration', 0.3);
    });

    it('should use easeOut easing', () => {
      expect(DEFAULT_TRANSITION).toHaveProperty('ease', 'easeOut');
    });
  });

  describe('SPRING_TRANSITION', () => {
    it('should use spring type', () => {
      expect(SPRING_TRANSITION).toHaveProperty('type', 'spring');
    });

    it('should have stiffness of 300', () => {
      expect(SPRING_TRANSITION).toHaveProperty('stiffness', 300);
    });

    it('should have damping of 30', () => {
      expect(SPRING_TRANSITION).toHaveProperty('damping', 30);
    });
  });
});

describe('Page Transition Variants', () => {
  describe('fadeIn', () => {
    it('should start with opacity 0', () => {
      expect(fadeIn.initial).toEqual({ opacity: 0 });
    });

    it('should animate to opacity 1', () => {
      expect(fadeIn.animate).toMatchObject({ opacity: 1 });
    });

    it('should exit to opacity 0', () => {
      expect(fadeIn.exit).toMatchObject({ opacity: 0 });
    });
  });

  describe('slideInLeft', () => {
    it('should start offset to the left with opacity 0', () => {
      expect(slideInLeft.initial).toEqual({ x: -20, opacity: 0 });
    });

    it('should animate to x 0 with opacity 1', () => {
      expect(slideInLeft.animate).toMatchObject({ x: 0, opacity: 1 });
    });

    it('should exit to the left with opacity 0', () => {
      expect(slideInLeft.exit).toMatchObject({ x: -20, opacity: 0 });
    });
  });

  describe('slideInRight', () => {
    it('should start offset to the right with opacity 0', () => {
      expect(slideInRight.initial).toEqual({ x: 20, opacity: 0 });
    });

    it('should animate to x 0 with opacity 1', () => {
      expect(slideInRight.animate).toMatchObject({ x: 0, opacity: 1 });
    });

    it('should exit to the right with opacity 0', () => {
      expect(slideInRight.exit).toMatchObject({ x: 20, opacity: 0 });
    });
  });

  describe('slideInUp', () => {
    it('should start offset below with opacity 0', () => {
      expect(slideInUp.initial).toEqual({ y: 20, opacity: 0 });
    });

    it('should animate to y 0 with opacity 1', () => {
      expect(slideInUp.animate).toMatchObject({ y: 0, opacity: 1 });
    });

    it('should exit downward with opacity 0', () => {
      expect(slideInUp.exit).toMatchObject({ y: 20, opacity: 0 });
    });
  });
});

describe('Widget Animation Variants', () => {
  describe('scaleIn', () => {
    it('should start at scale 0.95 with opacity 0', () => {
      expect(scaleIn.initial).toEqual({ scale: 0.95, opacity: 0 });
    });

    it('should animate to scale 1 with opacity 1', () => {
      expect(scaleIn.animate).toMatchObject({ scale: 1, opacity: 1 });
    });

    it('should exit at scale 0.95 with opacity 0', () => {
      expect(scaleIn.exit).toMatchObject({ scale: 0.95, opacity: 0 });
    });
  });

  describe('staggerContainer', () => {
    it('should have staggerChildren in animate transition', () => {
      const animate = staggerContainer.animate as Record<string, any>;
      expect(animate.transition).toHaveProperty('staggerChildren');
      expect(animate.transition.staggerChildren).toBeGreaterThan(0);
    });

    it('should have delayChildren in animate transition', () => {
      const animate = staggerContainer.animate as Record<string, any>;
      expect(animate.transition).toHaveProperty('delayChildren');
      expect(animate.transition.delayChildren).toBeGreaterThanOrEqual(0);
    });

    it('should have reverse stagger direction on exit', () => {
      const exit = staggerContainer.exit as Record<string, any>;
      expect(exit.transition).toHaveProperty('staggerDirection', -1);
    });
  });

  describe('staggerItem', () => {
    it('should start offset below with opacity 0', () => {
      expect(staggerItem.initial).toEqual({ y: 20, opacity: 0 });
    });

    it('should animate to y 0 with opacity 1', () => {
      expect(staggerItem.animate).toMatchObject({ y: 0, opacity: 1 });
    });

    it('should exit downward with opacity 0', () => {
      expect(staggerItem.exit).toMatchObject({ y: 20, opacity: 0 });
    });
  });
});

describe('Card Flip Variants', () => {
  describe('flipCard', () => {
    it('should start at rotateY 0', () => {
      expect(flipCard.initial).toMatchObject({ rotateY: 0 });
    });

    it('should flip to rotateY 180', () => {
      expect(flipCard.flipped).toMatchObject({ rotateY: 180 });
    });

    it('should have a flip transition with easeInOut', () => {
      const flipped = flipCard.flipped as Record<string, any>;
      expect(flipped.transition).toHaveProperty('ease', 'easeInOut');
    });

    it('should have a flip duration longer than default for smooth 3D effect', () => {
      const flipped = flipCard.flipped as Record<string, any>;
      expect(flipped.transition.duration).toBeGreaterThan(0.3);
    });
  });
});
