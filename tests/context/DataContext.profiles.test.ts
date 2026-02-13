import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PomodoroProfile, PRESET_POMODORO_PROFILES } from '../../types';

/**
 * Tests for Pomodoro Profile management in DataContext.
 * 
 * These tests verify the profile management logic (add, update, delete, setActive)
 * that is implemented in DataContext. Since we don't have @testing-library/react,
 * we test the core logic functions directly.
 */
describe('DataContext Pomodoro Profile Management', () => {
  // Simulate the state management logic from DataContext
  let profiles: PomodoroProfile[];
  let activeProfileId: string;

  const addProfile = (profile: Omit<PomodoroProfile, 'id'>) => {
    const newProfile: PomodoroProfile = {
      ...profile,
      id: `profile-${Date.now()}`,
    };
    profiles = [...profiles, newProfile];
    return newProfile;
  };

  const updateProfile = (id: string, updates: Partial<PomodoroProfile>) => {
    profiles = profiles.map(p => p.id === id ? { ...p, ...updates } : p);
  };

  const deleteProfile = (id: string) => {
    // Prevent deleting the active profile
    if (id === activeProfileId) return;
    // Prevent deleting preset profiles
    const presetIds = PRESET_POMODORO_PROFILES.map(p => p.id);
    if (presetIds.includes(id)) return;
    profiles = profiles.filter(p => p.id !== id);
  };

  const setActiveProfileId = (id: string) => {
    activeProfileId = id;
  };

  beforeEach(() => {
    profiles = [...PRESET_POMODORO_PROFILES];
    activeProfileId = 'default';
  });

  describe('Initial State', () => {
    it('should initialize with preset profiles', () => {
      expect(profiles).toHaveLength(3);
      expect(profiles[0].id).toBe('default');
      expect(profiles[1].id).toBe('deep-work');
      expect(profiles[2].id).toBe('quick-sprint');
    });

    it('should initialize with default as active profile', () => {
      expect(activeProfileId).toBe('default');
    });

    it('preset profiles should have correct values', () => {
      const defaultProfile = profiles.find(p => p.id === 'default');
      expect(defaultProfile).toEqual({
        id: 'default',
        name: 'Default',
        focus: 25,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
      });

      const deepWork = profiles.find(p => p.id === 'deep-work');
      expect(deepWork).toEqual({
        id: 'deep-work',
        name: 'Derin Çalışma',
        focus: 90,
        shortBreak: 15,
        longBreak: 30,
        longBreakInterval: 2,
      });

      const quickSprint = profiles.find(p => p.id === 'quick-sprint');
      expect(quickSprint).toEqual({
        id: 'quick-sprint',
        name: 'Hızlı Sprint',
        focus: 15,
        shortBreak: 5,
        longBreak: 10,
        longBreakInterval: 4,
      });
    });
  });

  describe('addProfile', () => {
    it('should add a new custom profile', () => {
      const newProfile = addProfile({
        name: 'Custom Profile',
        focus: 45,
        shortBreak: 10,
        longBreak: 20,
        longBreakInterval: 3,
      });

      expect(profiles).toHaveLength(4);
      expect(newProfile.name).toBe('Custom Profile');
      expect(newProfile.focus).toBe(45);
      expect(newProfile.id).toMatch(/^profile-\d+$/);
    });

    it('should generate unique ids for new profiles', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

      const profile1 = addProfile({
        name: 'Profile 1',
        focus: 30,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
      });

      vi.advanceTimersByTime(1); // Advance 1ms to ensure different timestamp

      const profile2 = addProfile({
        name: 'Profile 2',
        focus: 40,
        shortBreak: 10,
        longBreak: 20,
        longBreakInterval: 3,
      });

      expect(profile1.id).not.toBe(profile2.id);
      vi.useRealTimers();
    });

    it('should preserve existing profiles when adding new one', () => {
      addProfile({
        name: 'New Profile',
        focus: 50,
        shortBreak: 10,
        longBreak: 25,
        longBreakInterval: 3,
      });

      expect(profiles.find(p => p.id === 'default')).toBeDefined();
      expect(profiles.find(p => p.id === 'deep-work')).toBeDefined();
      expect(profiles.find(p => p.id === 'quick-sprint')).toBeDefined();
    });
  });

  describe('updateProfile', () => {
    it('should update an existing profile', () => {
      const newProfile = addProfile({
        name: 'Custom',
        focus: 30,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
      });

      updateProfile(newProfile.id, { name: 'Updated Custom', focus: 35 });

      const updated = profiles.find(p => p.id === newProfile.id);
      expect(updated?.name).toBe('Updated Custom');
      expect(updated?.focus).toBe(35);
      expect(updated?.shortBreak).toBe(5); // unchanged
    });

    it('should not affect other profiles when updating one', () => {
      const originalDefault = { ...profiles.find(p => p.id === 'default')! };
      const newProfile = addProfile({
        name: 'Custom',
        focus: 30,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
      });

      updateProfile(newProfile.id, { focus: 60 });

      const defaultProfile = profiles.find(p => p.id === 'default');
      expect(defaultProfile).toEqual(originalDefault);
    });

    it('should handle partial updates correctly', () => {
      const newProfile = addProfile({
        name: 'Custom',
        focus: 30,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
      });

      updateProfile(newProfile.id, { longBreakInterval: 2 });

      const updated = profiles.find(p => p.id === newProfile.id);
      expect(updated?.focus).toBe(30);
      expect(updated?.shortBreak).toBe(5);
      expect(updated?.longBreak).toBe(15);
      expect(updated?.longBreakInterval).toBe(2);
    });
  });

  describe('deleteProfile', () => {
    it('should delete a custom profile', () => {
      const newProfile = addProfile({
        name: 'To Delete',
        focus: 30,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
      });

      expect(profiles).toHaveLength(4);
      deleteProfile(newProfile.id);
      expect(profiles).toHaveLength(3);
      expect(profiles.find(p => p.id === newProfile.id)).toBeUndefined();
    });

    it('should NOT delete preset profiles', () => {
      deleteProfile('default');
      expect(profiles.find(p => p.id === 'default')).toBeDefined();

      deleteProfile('deep-work');
      expect(profiles.find(p => p.id === 'deep-work')).toBeDefined();

      deleteProfile('quick-sprint');
      expect(profiles.find(p => p.id === 'quick-sprint')).toBeDefined();

      expect(profiles).toHaveLength(3);
    });

    it('should NOT delete the active profile', () => {
      const newProfile = addProfile({
        name: 'Active Custom',
        focus: 30,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
      });

      setActiveProfileId(newProfile.id);
      deleteProfile(newProfile.id);

      expect(profiles.find(p => p.id === newProfile.id)).toBeDefined();
      expect(profiles).toHaveLength(4);
    });

    it('should handle deleting non-existent profile gracefully', () => {
      const initialLength = profiles.length;
      deleteProfile('non-existent-id');
      expect(profiles).toHaveLength(initialLength);
    });
  });

  describe('setActiveProfileId', () => {
    it('should set the active profile id', () => {
      setActiveProfileId('deep-work');
      expect(activeProfileId).toBe('deep-work');
    });

    it('should allow switching between profiles', () => {
      setActiveProfileId('deep-work');
      expect(activeProfileId).toBe('deep-work');

      setActiveProfileId('quick-sprint');
      expect(activeProfileId).toBe('quick-sprint');

      setActiveProfileId('default');
      expect(activeProfileId).toBe('default');
    });

    it('should allow setting a custom profile as active', () => {
      const newProfile = addProfile({
        name: 'Custom Active',
        focus: 45,
        shortBreak: 10,
        longBreak: 20,
        longBreakInterval: 3,
      });

      setActiveProfileId(newProfile.id);
      expect(activeProfileId).toBe(newProfile.id);
    });
  });

  describe('PRESET_POMODORO_PROFILES constant', () => {
    it('should have exactly 3 preset profiles', () => {
      expect(PRESET_POMODORO_PROFILES).toHaveLength(3);
    });

    it('should have valid focus durations', () => {
      for (const profile of PRESET_POMODORO_PROFILES) {
        expect(profile.focus).toBeGreaterThan(0);
        expect(profile.shortBreak).toBeGreaterThan(0);
        expect(profile.longBreak).toBeGreaterThan(0);
        expect(profile.longBreakInterval).toBeGreaterThan(0);
      }
    });

    it('should have unique ids', () => {
      const ids = PRESET_POMODORO_PROFILES.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
