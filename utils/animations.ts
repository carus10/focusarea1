import type { Variants, Transition } from 'framer-motion';

// ============================================================
// Utility Constants
// ============================================================

/** Default transition: 300ms with easeOut easing */
export const DEFAULT_TRANSITION: Transition = {
  duration: 0.3,
  ease: 'easeOut',
};

/** Spring transition for bouncy, natural-feeling animations */
export const SPRING_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

// ============================================================
// Page Transition Variants
// ============================================================

/** Fade in from transparent to fully visible */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: DEFAULT_TRANSITION },
  exit: { opacity: 0, transition: DEFAULT_TRANSITION },
};

/** Slide in from the left with fade */
export const slideInLeft: Variants = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: DEFAULT_TRANSITION },
  exit: { x: -20, opacity: 0, transition: DEFAULT_TRANSITION },
};

/** Slide in from the right with fade */
export const slideInRight: Variants = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: DEFAULT_TRANSITION },
  exit: { x: 20, opacity: 0, transition: DEFAULT_TRANSITION },
};

/** Slide in from below with fade */
export const slideInUp: Variants = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: DEFAULT_TRANSITION },
  exit: { y: 20, opacity: 0, transition: DEFAULT_TRANSITION },
};

// ============================================================
// Widget Animation Variants
// ============================================================

/** Scale in from slightly smaller with fade */
export const scaleIn: Variants = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: DEFAULT_TRANSITION },
  exit: { scale: 0.95, opacity: 0, transition: DEFAULT_TRANSITION },
};

/** Stagger container: orchestrates staggered children animations */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

/** Stagger item: used as child of staggerContainer */
export const staggerItem: Variants = {
  initial: { y: 20, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: DEFAULT_TRANSITION,
  },
  exit: {
    y: 20,
    opacity: 0,
    transition: DEFAULT_TRANSITION,
  },
};

// ============================================================
// Card Flip Variants
// ============================================================

/** 3D card flip: rotates card 180° around the Y axis */
export const flipCard: Variants = {
  initial: {
    rotateY: 0,
  },
  flipped: {
    rotateY: 180,
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
    },
  },
};
