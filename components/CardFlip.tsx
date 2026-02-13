import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { flipCard } from '../utils/animations';

// ============================================================
// Types
// ============================================================

export interface CardFlipProps {
  /** Content rendered on the front side of the card */
  front: React.ReactNode;
  /** Content rendered on the back side of the card */
  back: React.ReactNode;
  /** Controlled flip state (optional). When provided, the component is controlled externally. */
  isFlipped?: boolean;
  /** Callback fired when the card is flipped. Receives the new flipped state. */
  onFlip?: (isFlipped: boolean) => void;
  /** Additional CSS classes applied to the outermost container */
  className?: string;
  /** When true, disables click-to-flip and hover effects */
  disabled?: boolean;
}

// ============================================================
// Styles
// ============================================================

const containerStyle: React.CSSProperties = {
  perspective: '1000px',
};

const innerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  transformStyle: 'preserve-3d',
};

const faceStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backfaceVisibility: 'hidden',
  width: '100%',
  height: '100%',
};

const backFaceStyle: React.CSSProperties = {
  ...faceStyle,
  transform: 'rotateY(180deg)',
};

// ============================================================
// Component
// ============================================================

/**
 * A reusable card component with a 3D flip animation.
 *
 * Supports both **controlled** mode (pass `isFlipped`) and
 * **uncontrolled** mode (internal state manages the flip).
 *
 * Uses the `flipCard` variant from `utils/animations.ts` for the
 * rotation animation and adds a subtle hover scale effect.
 */
const CardFlip: React.FC<CardFlipProps> = ({
  front,
  back,
  isFlipped: controlledFlipped,
  onFlip,
  className = '',
  disabled = false,
}) => {
  // Internal state for uncontrolled mode
  const [internalFlipped, setInternalFlipped] = useState(false);

  // Determine whether we are in controlled mode
  const isControlled = controlledFlipped !== undefined;
  const flipped = isControlled ? controlledFlipped : internalFlipped;

  const handleClick = useCallback(() => {
    if (disabled) return;

    const nextFlipped = !flipped;

    if (!isControlled) {
      setInternalFlipped(nextFlipped);
    }

    onFlip?.(nextFlipped);
  }, [disabled, flipped, isControlled, onFlip]);

  return (
    <div
      style={containerStyle}
      className={className}
      data-testid="card-flip-container"
    >
      <motion.div
        style={innerStyle}
        variants={flipCard}
        initial="initial"
        animate={flipped ? 'flipped' : 'initial'}
        whileHover={disabled ? undefined : { scale: 1.02, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
        onClick={handleClick}
        data-testid="card-flip-inner"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={flipped ? 'Card showing back side' : 'Card showing front side'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Front face */}
        <div style={faceStyle} data-testid="card-flip-front">
          {front}
        </div>

        {/* Back face */}
        <div style={backFaceStyle} data-testid="card-flip-back">
          {back}
        </div>
      </motion.div>
    </div>
  );
};

export default React.memo(CardFlip);
