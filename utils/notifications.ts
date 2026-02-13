import type { NotificationOptions, NotificationType } from '../types';

/**
 * NotificationService - Bildirim yönetim servisi
 * 
 * Electron native notification ve Web Notification API desteği sağlar.
 * Electron ortamında window.electronAPI üzerinden IPC ile native bildirim gösterir,
 * web ortamında ise Web Notification API'yi fallback olarak kullanır.
 */
class NotificationService {
  private static permissionGranted = false;

  /**
   * İzin durumunu sıfırla (test amaçlı).
   */
  static resetPermission(): void {
    NotificationService.permissionGranted = false;
  }

  /**
   * Bildirim izni iste.
   * Electron ortamında izin otomatik olarak verilir.
   * Web ortamında Notification.requestPermission() kullanılır.
   * @returns İzin verilip verilmediği
   */
  static async requestPermission(): Promise<boolean> {
    // Electron ortamında bildirimler her zaman izinlidir
    if (typeof window !== 'undefined' && window.electronAPI) {
      NotificationService.permissionGranted = true;
      return true;
    }

    // Web ortamında Notification API kontrolü
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        NotificationService.permissionGranted = true;
        return true;
      }

      if (Notification.permission === 'denied') {
        NotificationService.permissionGranted = false;
        return false;
      }

      // İzin iste
      const permission = await Notification.requestPermission();
      NotificationService.permissionGranted = permission === 'granted';
      return NotificationService.permissionGranted;
    }

    // Notification API desteklenmiyor
    NotificationService.permissionGranted = false;
    return false;
  }

  /**
   * Genel bildirim göster.
   * Electron ortamında IPC üzerinden native bildirim,
   * web ortamında Web Notification API kullanır.
   * @param options Bildirim seçenekleri
   */
  static async show(options: NotificationOptions): Promise<void> {
    // İzin kontrolü - henüz izin alınmadıysa iste
    if (!NotificationService.permissionGranted) {
      const granted = await NotificationService.requestPermission();
      if (!granted) {
        console.warn('Bildirim izni verilmedi.');
        return;
      }
    }

    try {
      // Electron ortamında IPC ile bildirim gönder
      if (typeof window !== 'undefined' && window.electronAPI && 'showNotification' in window.electronAPI) {
        await (window.electronAPI as any).showNotification(options);
        return;
      }

      // Web Notification API fallback
      if (typeof Notification !== 'undefined') {
        new Notification(options.title, {
          body: options.body,
          icon: options.icon,
          silent: options.silent ?? false,
        });
        return;
      }

      console.warn('Bildirim gösterilemiyor: Desteklenen bir bildirim API\'si bulunamadı.');
    } catch (error) {
      console.error('Bildirim gösterilirken hata oluştu:', error);
    }
  }

  /**
   * Pomodoro tamamlandığında bildirim göster.
   */
  static async showPomodoroComplete(): Promise<void> {
    await NotificationService.show({
      title: '🍅 Pomodoro Tamamlandı!',
      body: 'Harika iş! Odaklanma seansın sona erdi. Mola zamanı!',
      type: 'pomodoroComplete' as NotificationType,
      urgency: 'normal',
    });
  }

  /**
   * Görev tamamlandığında bildirim göster.
   * @param taskName Tamamlanan görevin adı
   */
  static async showTaskComplete(taskName: string): Promise<void> {
    await NotificationService.show({
      title: '✅ Görev Tamamlandı!',
      body: `"${taskName}" görevi başarıyla tamamlandı!`,
      type: 'taskComplete' as NotificationType,
      urgency: 'low',
    });
  }

  /**
   * Ödül kazanıldığında bildirim göster.
   * @param rewardDescription Kazanılan ödülün açıklaması
   */
  static async showRewardEarned(rewardDescription: string): Promise<void> {
    await NotificationService.show({
      title: '🎁 Ödül Kazandın!',
      body: rewardDescription,
      type: 'rewardEarned' as NotificationType,
      urgency: 'low',
    });
  }

  /**
   * Kart açıldığında bildirim göster.
   * @param cardName Açılan kartın adı
   * @param rarity Kartın nadirlik seviyesi
   */
  static async showCardUnlocked(cardName: string, rarity: string): Promise<void> {
    await NotificationService.show({
      title: '🃏 Yeni Kart Açıldı!',
      body: `"${cardName}" kartını açtın! Nadirlik: ${rarity}`,
      type: 'cardUnlocked' as NotificationType,
      urgency: 'normal',
    });
  }
}

export default NotificationService;
