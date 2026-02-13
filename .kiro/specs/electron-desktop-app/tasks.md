# Implementation Plan: Electron Desktop App


## Faz 5: Müzik Widget İyileştirmeleri

- [x] 32. Müzik Widget Geliştirmeleri
  - [x] 32.1 SavedPlaylist type'ı güncelle (types.ts)
    - platform: 'youtube' | 'spotify' | 'custom'
    - thumbnail: string | null
    - duration: number | null
  
  - [x] 32.2 Playlist shuffle özelliği
    - Shuffle butonu
    - Rastgele playlist seçimi
    - Shuffle state yönetimi
  
  - [x] 32.3 Ses kontrolü
    - Volume slider
    - Mute/unmute butonu
    - Volume state localStorage'a kaydetme
  
  - [x] 32.4 Mini player (tüm sayfalarda görünür)
    - Sabit pozisyon (bottom-right)
    - Minimize/maximize
    - Şu an çalan playlist bilgisi
    - Play/pause, next, previous butonları

## Faz 6: İstatistik ve Analitik Dashboard

- [x] 33. İstatistik Dashboard'u oluştur
  - [x] 33.1 Analytics sayfası oluştur (pages/Analytics.tsx)
    - Genel bakış bölümü
    - Pomodoro istatistikleri
    - Görev istatistikleri
    - Ders ilerleme özeti
  
  - [x] 33.2 Haftalık/Aylık odaklanma raporu
    - Recharts ile grafik
    - Toplam odaklanma süresi
    - Günlük ortalama
    - Trend analizi (artış/azalış)
  
  - [x] 33.3 Üretkenlik trendi grafiği
    - Line chart (son 30 gün)
    - Pomodoro sayısı + görev tamamlama
    - Hareketli ortalama
  
  - [x] 33.4 En üretken saatler analizi
    - Heatmap (saat bazında)
    - Bar chart (saat dilimleri)
    - Öneriler (en iyi çalışma saatleri)
  
  - [x] 33.5 Görev tamamlama oranı
    - Pie chart (tamamlanan/tamamlanmayan)
    - Kategori bazında tamamlama oranı
    - Öncelik bazında tamamlama oranı
  
  - [x] 33.6 Ders ilerleme özeti
    - Her ders için ilerleme bar'ı
    - Toplam ilerleme yüzdesi
    - Tahmini tamamlanma süresi
  
  - [x] 33.7 Analytics sayfasını navigation'a ekle
    - Sidebar'a Analytics butonu ekle
    - Icon: BarChart

## Faz 7: Performans Optimizasyonları

- [x] 34. IndexedDB Migration
  - [x] 34.1 Dexie database schema oluştur (utils/db.ts)
    - tasks table
    - notes table
    - lessons table
    - pomodoroSessions table
    - settings table
  
  - [x] 34.2 Migration fonksiyonları
    - localStorage'dan IndexedDB'ye veri taşıma
    - Otomatik migration (ilk açılışta)
    - Backup oluşturma
  
  - [x] 34.3 DataContext'i IndexedDB kullanacak şekilde güncelle
    - useStickyState yerine useIndexedDB hook
    - Async state yönetimi
    - Loading states

- [x] 35. React.memo Optimizasyonları
  - [x] 35.1 Component'leri React.memo ile wrap et
    - PomodoroWidget
    - MusicWidget
    - MotivationWidget
    - InfoWidget
    - TaskItem
    - NoteItem
    - LessonItem
  
  - [x] 35.2 useMemo ve useCallback optimizasyonları
    - Pahalı hesaplamaları useMemo ile cache'le
    - Callback fonksiyonları useCallback ile memoize et
    - Dependency array'leri optimize et

- [x] 36. Lazy Loading
  - [x] 36.1 Sayfa component'lerini lazy load et
    - React.lazy kullan
    - Suspense wrapper
    - Loading fallback component'i
  
  - [x] 36.2 Büyük component'leri lazy load et
    - MarkdownEditor
    - Charts (Recharts)
    - CardFlip
  
  - [x] 36.3 Code splitting optimizasyonu
    - Route-based splitting
    - Component-based splitting



