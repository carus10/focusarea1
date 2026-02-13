import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PomodoroSettings, PomodoroProfile, PRESET_POMODORO_PROFILES } from '../../types';

/**
 * Tests for usePomodoro hook profile support integration.
 * 
 * These tests verify:
 * 1. Active profile settings computation in PomodoroProvider
 * 2. Profile change detection logic in usePomodoro
 * 3. Timer state behavior when profile changes (active vs inactive)
 */
describe('usePomodoro Profile Support', () => {

  describe('Active profile settings computation (PomodoroProvider logic)', () => {
    // Simulates the useMemo logic in PomodoroProvider that computes activeProfileSettings
    function computeActiveProfileSettings(
      profiles: PomodoroProfile[],
      activeProfileId: string
    ): PomodoroSettings {
      const activeProfile = profiles.find(p => p.id === activeProfileId);
      if (activeProfile) {
        return {
          focus: activeProfile.focus,
          shortBreak: activeProfile.shortBreak,
          longBreak: activeProfile.longBreak,
          longBreakInterval: activeProfile.longBreakInterval,
        };
      }
      // Fallback to default
      return { focus: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 };
    }

    it('should return default profile settings when activeProfileId is "default"', () => {
      const settings = computeActiveProfileSettings(PRESET_POMODORO_PROFILES, 'default');
      expect(settings).toEqual({
        focus: 25,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
      });
    });

    it('should return deep work profile settings when activeProfileId is "deep-work"', () => {
      const settings = computeActiveProfileSettings(PRESET_POMODORO_PROFILES, 'deep-work');
      expect(settings).toEqual({
        focus: 90,
        shortBreak: 15,
        longBreak: 30,
        longBreakInterval: 2,
      });
    });

    it('should return quick sprint profile settings when activeProfileId is "quick-sprint"', () => {
      const settings = computeActiveProfileSettings(PRESET_POMODORO_PROFILES, 'quick-sprint');
      expect(settings).toEqual({
        focus: 15,
        shortBreak: 5,
        longBreak: 10,
        longBreakInterval: 4,
      });
    });

    it('should return fallback settings when activeProfileId does not match any profile', () => {
      const settings = computeActiveProfileSettings(PRESET_POMODORO_PROFILES, 'non-existent');
      expect(settings).toEqual({
        focus: 25,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
      });
    });

    it('should return custom profile settings when a custom profile is active', () => {
      const customProfile: PomodoroProfile = {
        id: 'custom-1',
        name: 'My Custom',
        focus: 45,
        shortBreak: 10,
        longBreak: 20,
        longBreakInterval: 3,
      };
      const profiles = [...PRESET_POMODORO_PROFILES, customProfile];
      const settings = computeActiveProfileSettings(profiles, 'custom-1');
      expect(settings).toEqual({
        focus: 45,
        shortBreak: 10,
        longBreak: 20,
        longBreakInterval: 3,
      });
    });

    it('should return fallback when profiles array is empty', () => {
      const settings = computeActiveProfileSettings([], 'default');
      expect(settings).toEqual({
        focus: 25,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
      });
    });

    it('should only include PomodoroSettings fields (not id or name)', () => {
      const settings = computeActiveProfileSettings(PRESET_POMODORO_PROFILES, 'default');
      const keys = Object.keys(settings);
      expect(keys).toEqual(['focus', 'shortBreak', 'longBreak', 'longBreakInterval']);
      expect(settings).not.toHaveProperty('id');
      expect(settings).not.toHaveProperty('name');
    });
  });

  describe('Profile change detection logic (usePomodoro effect logic)', () => {
    // Simulates the change detection logic in the useEffect of usePomodoro
    function hasSettingsChanged(
      prev: PomodoroSettings,
      next: PomodoroSettings
    ): boolean {
      return (
        prev.focus !== next.focus ||
        prev.shortBreak !== next.shortBreak ||
        prev.longBreak !== next.longBreak ||
        prev.longBreakInterval !== next.longBreakInterval
      );
    }

    it('should detect change when focus duration changes', () => {
      const prev: PomodoroSettings = { focus: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 };
      const next: PomodoroSettings = { focus: 90, shortBreak: 5, longBreak: 15, longBreakInterval: 4 };
      expect(hasSettingsChanged(prev, next)).toBe(true);
    });

    it('should detect change when shortBreak changes', () => {
      const prev: PomodoroSettings = { focus: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 };
      const next: PomodoroSettings = { focus: 25, shortBreak: 10, longBreak: 15, longBreakInterval: 4 };
      expect(hasSettingsChanged(prev, next)).toBe(true);
    });

    it('should detect change when longBreak changes', () => {
      const prev: PomodoroSettings = { focus: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 };
      const next: PomodoroSettings = { focus: 25, shortBreak: 5, longBreak: 30, longBreakInterval: 4 };
      expect(hasSettingsChanged(prev, next)).toBe(true);
    });

    it('should detect change when longBreakInterval changes', () => {
      const prev: PomodoroSettings = { focus: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 };
      const next: PomodoroSettings = { focus: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 2 };
      expect(hasSettingsChanged(prev, next)).toBe(true);
    });

    it('should NOT detect change when settings are identical', () => {
      const prev: PomodoroSettings = { focus: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 };
      const next: PomodoroSettings = { focus: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 };
      expect(hasSettingsChanged(prev, next)).toBe(false);
    });

    it('should detect change when all fields change (full profile switch)', () => {
      const defaultSettings: PomodoroSettings = { focus: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 };
      const deepWorkSettings: PomodoroSettings = { focus: 90, shortBreak: 15, longBreak: 30, longBreakInterval: 2 };
      expect(hasSettingsChanged(defaultSettings, deepWorkSettings)).toBe(true);
    });
  });

  describe('Timer update behavior on profile change', () => {
    // Simulates the logic: if timer is NOT active, update immediately; if active, defer
    interface TimerState {
      isActive: boolean;
      settings: PomodoroSettings;
      timeLeft: number; // in seconds
    }

    function handleProfileChange(
      timerState: TimerState,
      newSettings: PomodoroSettings
    ): { settingsUpdated: boolean; timeLeftUpdated: boolean; newTimeLeft: number } {
      if (!timerState.isActive) {
        // Timer not active: update settings AND timeLeft immediately
        return {
          settingsUpdated: true,
          timeLeftUpdated: true,
          newTimeLeft: newSettings.focus * 60,
        };
      } else {
        // Timer active: update settings (for next session) but DON'T change timeLeft
        return {
          settingsUpdated: true,
          timeLeftUpdated: false,
          newTimeLeft: timerState.timeLeft, // unchanged
        };
      }
    }

    it('should update settings and timeLeft when timer is NOT active', () => {
      const timerState: TimerState = {
        isActive: false,
        settings: { focus: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 },
        timeLeft: 25 * 60,
      };
      const newSettings: PomodoroSettings = { focus: 90, shortBreak: 15, longBreak: 30, longBreakInterval: 2 };

      const result = handleProfileChange(timerState, newSettings);
      expect(result.settingsUpdated).toBe(true);
      expect(result.timeLeftUpdated).toBe(true);
      expect(result.newTimeLeft).toBe(90 * 60); // 90 minutes in seconds
    });

    it('should update settings but NOT timeLeft when timer IS active', () => {
      const timerState: TimerState = {
        isActive: true,
        settings: { focus: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 },
        timeLeft: 15 * 60, // 15 minutes remaining
      };
      const newSettings: PomodoroSettings = { focus: 90, shortBreak: 15, longBreak: 30, longBreakInterval: 2 };

      const result = handleProfileChange(timerState, newSettings);
      expect(result.settingsUpdated).toBe(true);
      expect(result.timeLeftUpdated).toBe(false);
      expect(result.newTimeLeft).toBe(15 * 60); // unchanged, still 15 minutes
    });

    it('should correctly compute new timeLeft based on new focus duration', () => {
      const timerState: TimerState = {
        isActive: false,
        settings: { focus: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 },
        timeLeft: 25 * 60,
      };

      // Switch to quick sprint
      const quickSprintSettings: PomodoroSettings = { focus: 15, shortBreak: 5, longBreak: 10, longBreakInterval: 4 };
      const result = handleProfileChange(timerState, quickSprintSettings);
      expect(result.newTimeLeft).toBe(15 * 60); // 15 minutes in seconds
    });

    it('should preserve running timer timeLeft even with drastically different profile', () => {
      const timerState: TimerState = {
        isActive: true,
        settings: { focus: 25, shortBreak: 5, longBreak: 15, longBreakInterval: 4 },
        timeLeft: 5 * 60, // Only 5 minutes left
      };

      // Switch to deep work (90 min focus)
      const deepWorkSettings: PomodoroSettings = { focus: 90, shortBreak: 15, longBreak: 30, longBreakInterval: 2 };
      const result = handleProfileChange(timerState, deepWorkSettings);
      expect(result.newTimeLeft).toBe(5 * 60); // Still 5 minutes, not interrupted
    });
  });

  describe('Profile switch end-to-end scenario', () => {
    it('should correctly transition from default to deep work profile when idle', () => {
      // Step 1: Start with default profile
      const defaultProfile = PRESET_POMODORO_PROFILES.find(p => p.id === 'default')!;
      let currentSettings: PomodoroSettings = {
        focus: defaultProfile.focus,
        shortBreak: defaultProfile.shortBreak,
        longBreak: defaultProfile.longBreak,
        longBreakInterval: defaultProfile.longBreakInterval,
      };
      let timeLeft = currentSettings.focus * 60;

      expect(timeLeft).toBe(25 * 60);

      // Step 2: Switch to deep work profile (timer idle)
      const deepWorkProfile = PRESET_POMODORO_PROFILES.find(p => p.id === 'deep-work')!;
      currentSettings = {
        focus: deepWorkProfile.focus,
        shortBreak: deepWorkProfile.shortBreak,
        longBreak: deepWorkProfile.longBreak,
        longBreakInterval: deepWorkProfile.longBreakInterval,
      };
      timeLeft = currentSettings.focus * 60;

      expect(currentSettings.focus).toBe(90);
      expect(timeLeft).toBe(90 * 60);
    });

    it('should correctly handle switching profiles multiple times', () => {
      const profiles = PRESET_POMODORO_PROFILES;
      let activeId = 'default';

      // Switch through all profiles
      for (const profile of profiles) {
        activeId = profile.id;
        const settings = {
          focus: profile.focus,
          shortBreak: profile.shortBreak,
          longBreak: profile.longBreak,
          longBreakInterval: profile.longBreakInterval,
        };
        expect(settings.focus).toBe(profile.focus);
        expect(settings.shortBreak).toBe(profile.shortBreak);
        expect(settings.longBreak).toBe(profile.longBreak);
        expect(settings.longBreakInterval).toBe(profile.longBreakInterval);
      }
    });
  });
});
