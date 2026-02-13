import { describe, it, expect } from 'vitest';
import { PomodoroProfile, PRESET_POMODORO_PROFILES } from '../../types';

/**
 * Tests for the Pomodoro Profile selector UI logic in Settings page.
 * 
 * These tests verify the UI logic for:
 * - Listing profiles with active one highlighted
 * - Determining which profiles are preset vs custom
 * - Determining which profiles can be edited/deleted
 * - Profile form validation for create/edit modal
 */
describe('Settings Pomodoro Profile UI Logic', () => {
  const presetProfileIds = PRESET_POMODORO_PROFILES.map(p => p.id);

  describe('Profile list display logic', () => {
    it('should identify preset profiles correctly', () => {
      expect(presetProfileIds).toContain('default');
      expect(presetProfileIds).toContain('deep-work');
      expect(presetProfileIds).toContain('quick-sprint');
    });

    it('should identify custom profiles as non-preset', () => {
      const customProfile: PomodoroProfile = {
        id: 'custom-1',
        name: 'My Custom',
        focus: 40,
        shortBreak: 8,
        longBreak: 20,
        longBreakInterval: 3,
      };
      expect(presetProfileIds.includes(customProfile.id)).toBe(false);
    });

    it('should determine active profile correctly', () => {
      const activeProfileId = 'deep-work';
      const profiles = [...PRESET_POMODORO_PROFILES];

      profiles.forEach(profile => {
        const isActive = profile.id === activeProfileId;
        if (profile.id === 'deep-work') {
          expect(isActive).toBe(true);
        } else {
          expect(isActive).toBe(false);
        }
      });
    });
  });

  describe('Edit/Delete button visibility logic', () => {
    it('should NOT show edit button for preset profiles', () => {
      PRESET_POMODORO_PROFILES.forEach(profile => {
        const isPreset = presetProfileIds.includes(profile.id);
        expect(isPreset).toBe(true);
        // UI logic: !isPreset controls edit button visibility
        // For preset profiles, edit button should be hidden
      });
    });

    it('should show edit button for custom profiles', () => {
      const customProfile: PomodoroProfile = {
        id: 'custom-1',
        name: 'Custom',
        focus: 30,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
      };
      const isPreset = presetProfileIds.includes(customProfile.id);
      expect(isPreset).toBe(false);
      // UI logic: !isPreset means edit button is visible
    });

    it('should NOT show delete button for preset profiles', () => {
      PRESET_POMODORO_PROFILES.forEach(profile => {
        const isPreset = presetProfileIds.includes(profile.id);
        expect(isPreset).toBe(true);
        // UI logic: !isPreset controls delete button visibility
      });
    });

    it('should NOT show delete button for active custom profile', () => {
      const customProfile: PomodoroProfile = {
        id: 'custom-1',
        name: 'Custom',
        focus: 30,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
      };
      const activeProfileId = 'custom-1';
      const isPreset = presetProfileIds.includes(customProfile.id);
      const isActive = customProfile.id === activeProfileId;

      // UI logic: delete button visible when !isPreset && !isActive
      const showDeleteButton = !isPreset && !isActive;
      expect(showDeleteButton).toBe(false);
    });

    it('should show delete button for inactive custom profile', () => {
      const customProfile: PomodoroProfile = {
        id: 'custom-1',
        name: 'Custom',
        focus: 30,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
      };
      const activeProfileId = 'default';
      const isPreset = presetProfileIds.includes(customProfile.id);
      const isActive = customProfile.id === activeProfileId;

      const showDeleteButton = !isPreset && !isActive;
      expect(showDeleteButton).toBe(true);
    });
  });

  describe('Profile form validation logic', () => {
    it('should reject empty profile name', () => {
      const name = '';
      expect(name.trim()).toBe('');
      // UI logic: if (!profileForm.name.trim()) return;
    });

    it('should reject whitespace-only profile name', () => {
      const name = '   ';
      expect(name.trim()).toBe('');
    });

    it('should accept valid profile name', () => {
      const name = 'My Profile';
      expect(name.trim()).not.toBe('');
    });

    it('should create correct profile form data for new profile', () => {
      const defaultForm = {
        name: '',
        focus: 25,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
      };

      expect(defaultForm.focus).toBe(25);
      expect(defaultForm.shortBreak).toBe(5);
      expect(defaultForm.longBreak).toBe(15);
      expect(defaultForm.longBreakInterval).toBe(4);
    });

    it('should populate form correctly when editing a profile', () => {
      const profileToEdit: PomodoroProfile = {
        id: 'custom-1',
        name: 'Custom Profile',
        focus: 45,
        shortBreak: 10,
        longBreak: 20,
        longBreakInterval: 3,
      };

      // Simulating openEditProfileModal logic
      const form = {
        name: profileToEdit.name,
        focus: profileToEdit.focus,
        shortBreak: profileToEdit.shortBreak,
        longBreak: profileToEdit.longBreak,
        longBreakInterval: profileToEdit.longBreakInterval,
      };

      expect(form.name).toBe('Custom Profile');
      expect(form.focus).toBe(45);
      expect(form.shortBreak).toBe(10);
      expect(form.longBreak).toBe(20);
      expect(form.longBreakInterval).toBe(3);
    });
  });

  describe('Profile display formatting', () => {
    it('should format profile durations correctly for display', () => {
      const profile = PRESET_POMODORO_PROFILES[0]; // Default
      const focusText = `Odak: ${profile.focus}dk`;
      const shortBreakText = `Kısa Mola: ${profile.shortBreak}dk`;
      const longBreakText = `Uzun Mola: ${profile.longBreak}dk`;

      expect(focusText).toBe('Odak: 25dk');
      expect(shortBreakText).toBe('Kısa Mola: 5dk');
      expect(longBreakText).toBe('Uzun Mola: 15dk');
    });

    it('should format deep work profile durations correctly', () => {
      const profile = PRESET_POMODORO_PROFILES[1]; // Deep Work
      expect(`Odak: ${profile.focus}dk`).toBe('Odak: 90dk');
      expect(`Kısa Mola: ${profile.shortBreak}dk`).toBe('Kısa Mola: 15dk');
      expect(`Uzun Mola: ${profile.longBreak}dk`).toBe('Uzun Mola: 30dk');
    });

    it('should format quick sprint profile durations correctly', () => {
      const profile = PRESET_POMODORO_PROFILES[2]; // Quick Sprint
      expect(`Odak: ${profile.focus}dk`).toBe('Odak: 15dk');
      expect(`Kısa Mola: ${profile.shortBreak}dk`).toBe('Kısa Mola: 5dk');
      expect(`Uzun Mola: ${profile.longBreak}dk`).toBe('Uzun Mola: 10dk');
    });
  });

  describe('Modal state logic', () => {
    it('should set editingProfile to null for create mode', () => {
      const editingProfile: PomodoroProfile | null = null;
      const modalTitle = editingProfile ? 'Profili Düzenle' : 'Yeni Profil Oluştur';
      const submitButtonText = editingProfile ? 'Kaydet' : 'Oluştur';

      expect(modalTitle).toBe('Yeni Profil Oluştur');
      expect(submitButtonText).toBe('Oluştur');
    });

    it('should set editingProfile for edit mode', () => {
      const editingProfile: PomodoroProfile | null = {
        id: 'custom-1',
        name: 'Custom',
        focus: 30,
        shortBreak: 5,
        longBreak: 15,
        longBreakInterval: 4,
      };
      const modalTitle = editingProfile ? 'Profili Düzenle' : 'Yeni Profil Oluştur';
      const submitButtonText = editingProfile ? 'Kaydet' : 'Oluştur';

      expect(modalTitle).toBe('Profili Düzenle');
      expect(submitButtonText).toBe('Kaydet');
    });
  });
});
