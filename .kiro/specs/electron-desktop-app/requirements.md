# Requirements Document

## Introduction

Bu doküman, mevcut React tabanlı Full-Focus Dashboard web uygulamasının Windows masaüstü uygulamasına dönüştürülmesi için gereksinimleri tanımlar. Uygulama Electron framework'ü kullanılarak paketlenecek ve kullanıcılar tarayıcı olmadan bağımsız bir masaüstü uygulaması olarak çalıştırabileceklerdir.

## Glossary

- **Electron_App**: Electron framework'ü kullanılarak oluşturulan masaüstü uygulaması
- **Main_Process**: Electron'un ana işlem süreci, pencere yönetimi ve sistem kaynaklarına erişimden sorumlu
- **Renderer_Process**: Electron'un render işlem süreci, React uygulamasının çalıştığı süreç
- **React_App**: Mevcut React + TypeScript + Vite tabanlı web uygulaması
- **Build_System**: Uygulamayı derleyen ve paketleyen sistem (Vite + Electron Builder)
- **IPC**: Inter-Process Communication, Main ve Renderer süreçleri arasındaki iletişim mekanizması
- **Executable**: Windows'ta çalıştırılabilir .exe dosyası
- **Environment_Variables**: Uygulama yapılandırması için kullanılan ortam değişkenleri (API anahtarları gibi)

## Requirements

### Requirement 1: Electron Framework Entegrasyonu

**User Story:** Geliştirici olarak, mevcut React uygulamasını Electron ile paketlemek istiyorum, böylece uygulama masaüstü ortamında çalışabilsin.

#### Acceptance Criteria

1. THE Electron_App SHALL integrate Electron framework with the existing React_App
2. WHEN the application starts, THE Main_Process SHALL create a browser window and load the React_App
3. THE Electron_App SHALL maintain separation between Main_Process and Renderer_Process
4. THE Build_System SHALL compile both Electron main process code and React application code
5. WHEN building for production, THE Build_System SHALL bundle all dependencies correctly

### Requirement 2: Windows Masaüstü Uygulaması Oluşturma

**User Story:** Kullanıcı olarak, uygulamayı Windows masaüstünde çift tıklanabilir bir .exe dosyası olarak çalıştırmak istiyorum, böylece tarayıcıya ihtiyaç duymadan kullanabileyim.

#### Acceptance Criteria

1. THE Build_System SHALL generate a Windows Executable file
2. WHEN a user double-clicks the Executable, THE Electron_App SHALL launch in its own window
3. THE Electron_App SHALL run without requiring a web browser
4. THE Electron_App SHALL display a native Windows application window with title bar and controls
5. WHEN the application window is closed, THE Electron_App SHALL terminate completely

### Requirement 3: Mevcut Özelliklerin Korunması

**User Story:** Kullanıcı olarak, masaüstü uygulamasında web versiyonundaki tüm özelliklerin çalışmasını istiyorum, böylece hiçbir işlevsellik kaybetmeden kullanabileyim.

#### Acceptance Criteria

1. THE Electron_App SHALL preserve all existing React_App components (Dashboard, Tasks, Notes, Settings, Collection, Exercise, Lessons, MusicPlaylists)
2. THE Electron_App SHALL preserve all existing widgets (Pomodoro, Music, Motivation, Info)
3. THE Electron_App SHALL maintain DataContext functionality for state management
4. THE Electron_App SHALL maintain usePomodoro hook functionality
5. WHEN a user interacts with any feature, THE Electron_App SHALL behave identically to the web version
6. THE Electron_App SHALL preserve theme switching functionality (dark/light mode)
7. THE Electron_App SHALL preserve background animation effects (aurora effect)

### Requirement 4: Ortam Değişkenleri Yönetimi

**User Story:** Geliştirici olarak, API anahtarları gibi hassas bilgilerin güvenli bir şekilde yönetilmesini istiyorum, böylece masaüstü uygulamasında da çalışabilsin.

#### Acceptance Criteria

1. THE Electron_App SHALL load Environment_Variables from a secure configuration file
2. WHEN the application starts, THE Main_Process SHALL provide Environment_Variables to the Renderer_Process securely
3. THE Electron_App SHALL support GEMINI_API_KEY environment variable
4. THE Electron_App SHALL NOT expose Environment_Variables in the bundled application code
5. WHERE Environment_Variables are missing, THE Electron_App SHALL provide clear error messages

### Requirement 5: Geliştirme ve Üretim Build Süreçleri

**User Story:** Geliştirici olarak, hem geliştirme hem de üretim ortamları için ayrı build süreçlerine ihtiyacım var, böylece verimli bir şekilde çalışabileyim.

#### Acceptance Criteria

1. THE Build_System SHALL provide a development mode with hot-reload functionality
2. WHEN running in development mode, THE Electron_App SHALL automatically reload on code changes
3. THE Build_System SHALL provide a production build command that creates an optimized Executable
4. WHEN building for production, THE Build_System SHALL minify and optimize all assets
5. THE Build_System SHALL include all necessary dependencies in the production Executable

### Requirement 6: Pencere Yönetimi

**User Story:** Kullanıcı olarak, uygulama penceresinin boyutunu ayarlayabilmek ve tam ekran yapabilmek istiyorum, böylece tercihlerime göre kullanabileyim.

#### Acceptance Criteria

1. WHEN the application starts, THE Electron_App SHALL open with a default window size of 1200x800 pixels
2. THE Electron_App SHALL allow users to resize the application window
3. THE Electron_App SHALL remember the last window size and position
4. THE Electron_App SHALL support fullscreen mode
5. THE Electron_App SHALL set a minimum window size of 800x600 pixels

### Requirement 7: Harici Bağlantılar Yönetimi

**User Story:** Kullanıcı olarak, uygulamadaki harici bağlantıların (YouTube, Notion vb.) sistem tarayıcısında açılmasını istiyorum, böylece uygulama içinde sıkışıp kalmayayım.

#### Acceptance Criteria

1. WHEN a user clicks an external link, THE Electron_App SHALL open the link in the system default browser
2. THE Electron_App SHALL NOT navigate away from the application when external links are clicked
3. THE Electron_App SHALL handle all ExternalLink items (Notebook, YouTube, Notion, NotebookLM, AI Studio) correctly

### Requirement 8: Uygulama İkonu ve Metadata

**User Story:** Kullanıcı olarak, uygulamanın profesyonel bir ikona ve doğru metadata'ya sahip olmasını istiyorum, böylece Windows'ta düzgün görünsün.

#### Acceptance Criteria

1. THE Executable SHALL display a custom application icon in Windows Explorer
2. THE Executable SHALL display the application icon in the Windows taskbar
3. THE Executable SHALL include application metadata (name, version, description, author)
4. THE Electron_App SHALL display "Full-Focus Dashboard" as the window title
5. THE Executable SHALL have proper file properties visible in Windows

### Requirement 9: Yerel Depolama ve Veri Kalıcılığı

**User Story:** Kullanıcı olarak, uygulama verilerimin (notlar, görevler, ayarlar) masaüstü uygulamasında da saklanmasını istiyorum, böylece her açılışta verilerim korunsun.

#### Acceptance Criteria

1. THE Electron_App SHALL use the same localStorage mechanism as the web version
2. WHEN the application is closed and reopened, THE Electron_App SHALL restore all user data
3. THE Electron_App SHALL store data in the user's application data directory
4. THE Electron_App SHALL maintain data persistence across application updates
5. WHEN data is saved, THE Electron_App SHALL write changes immediately to disk

### Requirement 10: Hata Yönetimi ve Loglama

**User Story:** Geliştirici olarak, uygulamada oluşan hataların loglanmasını istiyorum, böylece sorunları tespit edip çözebileyim.

#### Acceptance Criteria

1. WHEN an error occurs in the Main_Process, THE Electron_App SHALL log the error to a file
2. WHEN an error occurs in the Renderer_Process, THE Electron_App SHALL log the error to a file
3. THE Electron_App SHALL create log files in the user's application data directory
4. WHEN a critical error occurs, THE Electron_App SHALL display a user-friendly error message
5. THE Electron_App SHALL include timestamps and stack traces in error logs
