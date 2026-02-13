import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import NotificationService from '../../utils/notifications';
import type { NotificationOptions } from '../../types';

describe('NotificationService', () => {
  let originalWindow: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the permissionGranted state
    NotificationService.resetPermission();
    originalWindow = { ...global.window };
  });

  afterEach(() => {
    // Restore window
    (global as any).window = originalWindow;
  });

  describe('requestPermission', () => {
    it('should return true in Electron environment', async () => {
      (global as any).window = {
        electronAPI: {
          getEnvVariables: vi.fn(),
          openExternal: vi.fn(),
          logError: vi.fn(),
          platform: 'win32',
          versions: { node: '18', chrome: '120', electron: '28' },
        },
      };

      const result = await NotificationService.requestPermission();
      expect(result).toBe(true);
    });

    it('should return true when Web Notification permission is already granted', async () => {
      (global as any).window = {};
      (global as any).Notification = {
        permission: 'granted',
        requestPermission: vi.fn(),
      };

      const result = await NotificationService.requestPermission();
      expect(result).toBe(true);

      delete (global as any).Notification;
    });

    it('should return false when Web Notification permission is denied', async () => {
      (global as any).window = {};
      (global as any).Notification = {
        permission: 'denied',
        requestPermission: vi.fn(),
      };

      const result = await NotificationService.requestPermission();
      expect(result).toBe(false);

      delete (global as any).Notification;
    });

    it('should request permission when Web Notification permission is default', async () => {
      (global as any).window = {};
      (global as any).Notification = {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      };

      const result = await NotificationService.requestPermission();
      expect(result).toBe(true);
      expect(Notification.requestPermission).toHaveBeenCalled();

      delete (global as any).Notification;
    });

    it('should return false when permission request is denied', async () => {
      (global as any).window = {};
      (global as any).Notification = {
        permission: 'default',
        requestPermission: vi.fn().mockResolvedValue('denied'),
      };

      const result = await NotificationService.requestPermission();
      expect(result).toBe(false);

      delete (global as any).Notification;
    });

    it('should return false when Notification API is not available', async () => {
      (global as any).window = {};
      // Ensure no Notification global
      delete (global as any).Notification;

      const result = await NotificationService.requestPermission();
      expect(result).toBe(false);
    });
  });

  describe('show', () => {
    it('should use Electron IPC when showNotification is available', async () => {
      const mockShowNotification = vi.fn().mockResolvedValue(undefined);
      (global as any).window = {
        electronAPI: {
          showNotification: mockShowNotification,
          getEnvVariables: vi.fn(),
          openExternal: vi.fn(),
          logError: vi.fn(),
          platform: 'win32',
          versions: { node: '18', chrome: '120', electron: '28' },
        },
      };

      // First grant permission
      await NotificationService.requestPermission();

      const options: NotificationOptions = {
        title: 'Test Title',
        body: 'Test Body',
        type: 'general',
      };

      await NotificationService.show(options);
      expect(mockShowNotification).toHaveBeenCalledWith(options);
    });

    it('should use Web Notification API as fallback when electronAPI has no showNotification', async () => {
      const mockNotificationConstructor = vi.fn();
      (global as any).window = {
        electronAPI: {
          // No showNotification method - simulates before task 21.2 is done
          getEnvVariables: vi.fn(),
          openExternal: vi.fn(),
          logError: vi.fn(),
          platform: 'win32',
          versions: { node: '18', chrome: '120', electron: '28' },
        },
      };
      (global as any).Notification = Object.assign(mockNotificationConstructor, {
        permission: 'granted',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      });

      // Grant permission first (Electron env grants automatically)
      await NotificationService.requestPermission();

      // Now remove electronAPI to test web fallback path
      // Actually, the code checks for 'showNotification' in electronAPI
      // Since it's not there, it should fall through to Web Notification
      const options: NotificationOptions = {
        title: 'Test Title',
        body: 'Test Body',
        type: 'general',
        silent: false,
      };

      await NotificationService.show(options);
      expect(mockNotificationConstructor).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: undefined,
        silent: false,
      });

      delete (global as any).Notification;
    });

    it('should use Web Notification API in web environment', async () => {
      const mockNotificationConstructor = vi.fn();
      (global as any).window = {};
      (global as any).Notification = Object.assign(mockNotificationConstructor, {
        permission: 'granted',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      });

      await NotificationService.requestPermission();

      const options: NotificationOptions = {
        title: 'Web Test',
        body: 'Web Body',
        type: 'general',
        icon: '/icon.png',
        silent: true,
      };

      await NotificationService.show(options);
      expect(mockNotificationConstructor).toHaveBeenCalledWith('Web Test', {
        body: 'Web Body',
        icon: '/icon.png',
        silent: true,
      });

      delete (global as any).Notification;
    });

    it('should not show notification when permission is not granted', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      (global as any).window = {};
      delete (global as any).Notification;

      const options: NotificationOptions = {
        title: 'Test',
        body: 'Body',
        type: 'general',
      };

      await NotificationService.show(options);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Bildirim izni verilmedi.');

      consoleWarnSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockShowNotification = vi.fn().mockRejectedValue(new Error('IPC failed'));
      (global as any).window = {
        electronAPI: {
          showNotification: mockShowNotification,
          getEnvVariables: vi.fn(),
          openExternal: vi.fn(),
          logError: vi.fn(),
          platform: 'win32',
          versions: { node: '18', chrome: '120', electron: '28' },
        },
      };

      await NotificationService.requestPermission();

      const options: NotificationOptions = {
        title: 'Test',
        body: 'Body',
        type: 'general',
      };

      // Should not throw
      await expect(NotificationService.show(options)).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should default silent to false when not specified', async () => {
      const mockNotificationConstructor = vi.fn();
      (global as any).window = {};
      (global as any).Notification = Object.assign(mockNotificationConstructor, {
        permission: 'granted',
        requestPermission: vi.fn().mockResolvedValue('granted'),
      });

      await NotificationService.requestPermission();

      const options: NotificationOptions = {
        title: 'Test',
        body: 'Body',
        type: 'general',
        // silent not specified
      };

      await NotificationService.show(options);
      expect(mockNotificationConstructor).toHaveBeenCalledWith('Test', {
        body: 'Body',
        icon: undefined,
        silent: false,
      });

      delete (global as any).Notification;
    });
  });

  describe('showPomodoroComplete', () => {
    it('should show notification with correct Turkish message', async () => {
      const showSpy = vi.spyOn(NotificationService, 'show').mockResolvedValue(undefined);

      await NotificationService.showPomodoroComplete();

      expect(showSpy).toHaveBeenCalledWith({
        title: '🍅 Pomodoro Tamamlandı!',
        body: 'Harika iş! Odaklanma seansın sona erdi. Mola zamanı!',
        type: 'pomodoroComplete',
        urgency: 'normal',
      });

      showSpy.mockRestore();
    });
  });

  describe('showTaskComplete', () => {
    it('should show notification with task name', async () => {
      const showSpy = vi.spyOn(NotificationService, 'show').mockResolvedValue(undefined);

      await NotificationService.showTaskComplete('Rapor yaz');

      expect(showSpy).toHaveBeenCalledWith({
        title: '✅ Görev Tamamlandı!',
        body: '"Rapor yaz" görevi başarıyla tamamlandı!',
        type: 'taskComplete',
        urgency: 'low',
      });

      showSpy.mockRestore();
    });

    it('should handle empty task name', async () => {
      const showSpy = vi.spyOn(NotificationService, 'show').mockResolvedValue(undefined);

      await NotificationService.showTaskComplete('');

      expect(showSpy).toHaveBeenCalledWith({
        title: '✅ Görev Tamamlandı!',
        body: '"" görevi başarıyla tamamlandı!',
        type: 'taskComplete',
        urgency: 'low',
      });

      showSpy.mockRestore();
    });
  });

  describe('showRewardEarned', () => {
    it('should show notification with reward description', async () => {
      const showSpy = vi.spyOn(NotificationService, 'show').mockResolvedValue(undefined);

      await NotificationService.showRewardEarned('50 OP kazandın!');

      expect(showSpy).toHaveBeenCalledWith({
        title: '🎁 Ödül Kazandın!',
        body: '50 OP kazandın!',
        type: 'rewardEarned',
        urgency: 'low',
      });

      showSpy.mockRestore();
    });
  });

  describe('showCardUnlocked', () => {
    it('should show notification with card name and rarity', async () => {
      const showSpy = vi.spyOn(NotificationService, 'show').mockResolvedValue(undefined);

      await NotificationService.showCardUnlocked('Ejderha', 'Legendary');

      expect(showSpy).toHaveBeenCalledWith({
        title: '🃏 Yeni Kart Açıldı!',
        body: '"Ejderha" kartını açtın! Nadirlik: Legendary',
        type: 'cardUnlocked',
        urgency: 'normal',
      });

      showSpy.mockRestore();
    });

    it('should handle different rarity levels', async () => {
      const showSpy = vi.spyOn(NotificationService, 'show').mockResolvedValue(undefined);

      await NotificationService.showCardUnlocked('Kedi', 'Common');

      expect(showSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          body: '"Kedi" kartını açtın! Nadirlik: Common',
        })
      );

      showSpy.mockRestore();
    });
  });
});
