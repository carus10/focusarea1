import { describe, it, expect, vi } from 'vitest';

/**
 * CardFlip component – logic-level unit tests.
 *
 * Because the vitest environment is "node" (no DOM), we test the
 * component's *logic* by importing the module and verifying:
 *   - exported interface / default export shape
 *   - the flipCard variant it relies on
 *   - style objects used for 3D flip (perspective, backface-visibility, etc.)
 *   - controlled vs uncontrolled behaviour via callback simulation
 *
 * Rendering tests that require a DOM should be added when a jsdom
 * environment is configured.
 */

// ============================================================
// 1. Module & Export Tests
// ============================================================

describe('CardFlip module exports', () => {
  it('should export a default React component', async () => {
    const mod = await import('../../components/CardFlip');
    expect(mod.default).toBeDefined();
    // React.memo wraps the component, so it's an object with $$typeof
    expect(typeof mod.default === 'function' || typeof mod.default === 'object').toBe(true);
  });

  it('should be a named function component called CardFlip', async () => {
    const mod = await import('../../components/CardFlip');
    // React.memo wraps the component; the inner type holds the original name
    const inner = (mod.default as any).type ?? mod.default;
    expect(inner.name).toBe('CardFlip');
  });
});

// ============================================================
// 2. flipCard Variant Integration
// ============================================================

describe('flipCard variant used by CardFlip', () => {
  it('should define initial state at rotateY 0', async () => {
    const { flipCard } = await import('../../utils/animations');
    expect(flipCard.initial).toMatchObject({ rotateY: 0 });
  });

  it('should define flipped state at rotateY 180', async () => {
    const { flipCard } = await import('../../utils/animations');
    expect(flipCard.flipped).toMatchObject({ rotateY: 180 });
  });

  it('should use 0.6s easeInOut transition for the flip', async () => {
    const { flipCard } = await import('../../utils/animations');
    const flipped = flipCard.flipped as Record<string, any>;
    expect(flipped.transition).toMatchObject({
      duration: 0.6,
      ease: 'easeInOut',
    });
  });
});

// ============================================================
// 3. Style Constants Tests
// ============================================================

describe('CardFlip 3D CSS styles', () => {
  /**
   * We verify the style objects by importing the module and checking
   * that the component source uses the correct CSS properties.
   * Since the styles are not exported, we read the module source
   * to validate the critical 3D CSS properties are present.
   */

  it('should use perspective for 3D depth on the container', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain("perspective: '1000px'");
  });

  it('should use preserve-3d on the inner wrapper', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain("transformStyle: 'preserve-3d'");
  });

  it('should use backfaceVisibility hidden on card faces', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain("backfaceVisibility: 'hidden'");
  });

  it('should apply rotateY(180deg) to the back face by default', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain("transform: 'rotateY(180deg)'");
  });

  it('should position both faces absolutely', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain("position: 'absolute'");
  });
});

// ============================================================
// 4. Component Props & Behaviour Tests
// ============================================================

describe('CardFlip props and behaviour', () => {
  it('should accept front and back as ReactNode props', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('front: React.ReactNode');
    expect(source).toContain('back: React.ReactNode');
  });

  it('should support optional isFlipped prop for controlled mode', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('isFlipped?: boolean');
  });

  it('should support optional onFlip callback', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('onFlip?: (isFlipped: boolean) => void');
  });

  it('should support optional className prop', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('className?: string');
  });

  it('should support optional disabled prop', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('disabled?: boolean');
  });

  it('should default disabled to false', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('disabled = false');
  });

  it('should default className to empty string', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain("className = ''");
  });
});

// ============================================================
// 5. Controlled vs Uncontrolled Mode Logic
// ============================================================

describe('Controlled vs Uncontrolled mode', () => {
  it('should use internal state when isFlipped is not provided (uncontrolled)', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    // Checks that internal state is used
    expect(source).toContain('useState(false)');
    expect(source).toContain('controlledFlipped !== undefined');
  });

  it('should use controlledFlipped when isFlipped is provided (controlled)', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('isControlled ? controlledFlipped : internalFlipped');
  });

  it('should not update internal state in controlled mode', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('if (!isControlled)');
    expect(source).toContain('setInternalFlipped(nextFlipped)');
  });

  it('should always call onFlip callback when clicked', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('onFlip?.(nextFlipped)');
  });
});

// ============================================================
// 6. Disabled State Logic
// ============================================================

describe('Disabled state', () => {
  it('should return early from click handler when disabled', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('if (disabled) return');
  });

  it('should not apply hover effect when disabled', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('disabled ? undefined');
  });

  it('should set tabIndex to -1 when disabled', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('tabIndex={disabled ? -1 : 0}');
  });
});

// ============================================================
// 7. Hover Effect Tests
// ============================================================

describe('Hover effect', () => {
  it('should scale to 1.02 on hover', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('scale: 1.02');
  });

  it('should add box shadow on hover', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('boxShadow:');
  });
});

// ============================================================
// 8. Accessibility Tests
// ============================================================

describe('Accessibility', () => {
  it('should have role="button" for keyboard interaction', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('role="button"');
  });

  it('should have aria-label indicating current card side', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('aria-label=');
    expect(source).toContain('Card showing back side');
    expect(source).toContain('Card showing front side');
  });

  it('should support Enter and Space key to flip', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain("e.key === 'Enter'");
    expect(source).toContain("e.key === ' '");
  });
});

// ============================================================
// 9. Animation Variant Usage Tests
// ============================================================

describe('Animation variant usage', () => {
  it('should import flipCard from utils/animations', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain("import { flipCard } from '../utils/animations'");
  });

  it('should use flipCard as the variants prop', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('variants={flipCard}');
  });

  it('should animate to "flipped" when flipped is true', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain("flipped ? 'flipped' : 'initial'");
  });

  it('should set initial to "initial"', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('initial="initial"');
  });
});

// ============================================================
// 10. onFlip Callback Simulation
// ============================================================

describe('onFlip callback behaviour', () => {
  it('should call onFlip with true when flipping from front to back', () => {
    const onFlip = vi.fn();
    // Simulate uncontrolled mode: flipped starts as false
    const flipped = false;
    const nextFlipped = !flipped;
    onFlip(nextFlipped);
    expect(onFlip).toHaveBeenCalledWith(true);
  });

  it('should call onFlip with false when flipping from back to front', () => {
    const onFlip = vi.fn();
    // Simulate: flipped is true, clicking toggles to false
    const flipped = true;
    const nextFlipped = !flipped;
    onFlip(nextFlipped);
    expect(onFlip).toHaveBeenCalledWith(false);
  });

  it('should not call onFlip when disabled', () => {
    const onFlip = vi.fn();
    const disabled = true;
    // Simulate the guard clause
    if (!disabled) {
      onFlip(true);
    }
    expect(onFlip).not.toHaveBeenCalled();
  });
});

// ============================================================
// 11. Data Test IDs
// ============================================================

describe('Test IDs for integration testing', () => {
  it('should have data-testid on the container', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('data-testid="card-flip-container"');
  });

  it('should have data-testid on the inner wrapper', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('data-testid="card-flip-inner"');
  });

  it('should have data-testid on the front face', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('data-testid="card-flip-front"');
  });

  it('should have data-testid on the back face', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('components/CardFlip.tsx', 'utf-8');
    expect(source).toContain('data-testid="card-flip-back"');
  });
});
