import React, { useState, useMemo, useContext, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TimerMode, PomodoroSettings, PostPomodoroCategories, PostPomodoroCategory, Page } from '../types.ts';
import Icon from './Icon.tsx';
import Modal from './Modal.tsx';
import { DataContext, PomodoroContext } from '../context/DataContext.tsx';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const PomodoroWidget: React.FC = () => {
    const { 
        pomodoroSessions,
        motivationalVideos, 
        postPomodoroVideos, 
        setActivePage,
        pomodoroGoal,
        setDailyGoal,
        setWeeklyGoal,
        dailyGoalProgress,
        weeklyGoalProgress,
    } = useContext(DataContext);
    const {
        timeLeft,
        mode,
        isActive,
        settings,
        toggleTimer,
        resetTimer,
        skipTimer,
        updateSettings,
        pomodoroFocusCompleted,
        acknowledgePomodoroFocusCompleted,
        lastEarnedRewards,
    } = useContext(PomodoroContext);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMotivationModalOpen, setIsMotivationModalOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState<PomodoroSettings>(settings);
  const [tempDailyGoal, setTempDailyGoal] = useState(pomodoroGoal.dailyTarget);
  const [tempWeeklyGoal, setTempWeeklyGoal] = useState(pomodoroGoal.weeklyTarget);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
      setTempSettings(settings);
  }, [settings]);

  useEffect(() => {
      setTempDailyGoal(pomodoroGoal.dailyTarget);
      setTempWeeklyGoal(pomodoroGoal.weeklyTarget);
  }, [pomodoroGoal.dailyTarget, pomodoroGoal.weeklyTarget]);

  useEffect(() => {
    if (pomodoroFocusCompleted) {
        setIsRewardModalOpen(true);
    }
  }, [pomodoroFocusCompleted]);

  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
        // Tarayıcıdan çıkış yapıldığında (örn. Esc tuşu ile) bileşen durumunu senkronize et
        if (!document.fullscreenElement) {
            setIsFullScreen(false);
        }
    };

    if (isFullScreen) {
        // Tarayıcı zaten tam ekran değilse tam ekran moduna geç
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {
                // Başarısız olursa durumu geri al
                setIsFullScreen(false);
            });
        }
    } else {
        // Tarayıcı tam ekrandaysa çıkış yap
        if (document.exitFullscreen && document.fullscreenElement) {
            document.exitFullscreen();
        }
    }

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, [isFullScreen]);


  const handleSettingsSave = () => {
    updateSettings(tempSettings);
    setIsSettingsOpen(false);
  };

  const handleGoalSave = () => {
    setDailyGoal(tempDailyGoal);
    setWeeklyGoal(tempWeeklyGoal);
    setIsGoalModalOpen(false);
  };

  const startTimer = () => {
    setIsMotivationModalOpen(false);
    if (!isActive) {
        toggleTimer();
    }
  };

  const handlePlayPauseClick = () => {
    if (isActive) {
        toggleTimer();
    } else {
        if (mode !== TimerMode.Focus || timeLeft !== settings.focus * 60 || motivationalVideos.length === 0) {
            toggleTimer();
        } else {
            setIsMotivationModalOpen(true);
        }
    }
  };

  const handleMotivationYes = () => {
      if (motivationalVideos.length > 0) {
          const randomVideo = motivationalVideos[Math.floor(Math.random() * motivationalVideos.length)];
          window.open(randomVideo.url, '_blank', 'noopener,noreferrer');
      }
      startTimer();
  };

  const handleMotivationNo = () => {
      startTimer();
  };
  
  const closeRewardModalAndContinue = () => {
    setIsRewardModalOpen(false);
    acknowledgePomodoroFocusCompleted();
    skipTimer(); // Proceed to the break
  };

  const handleRewardChoice = (category: PostPomodoroCategory | null) => {
    if (category && postPomodoroVideos[category] && postPomodoroVideos[category].length > 0) {
        const randomVideo = postPomodoroVideos[category][Math.floor(Math.random() * postPomodoroVideos[category].length)];
        window.open(randomVideo.url, '_blank', 'noopener,noreferrer');
    }
    closeRewardModalAndContinue();
  };
  
  const handleGoToExercise = () => {
    setActivePage(Page.Exercise);
    closeRewardModalAndContinue();
  };


  const progress = (timeLeft / (settings[mode] * 60)) * 100;

  const modeText = {
    [TimerMode.Focus]: "Focus",
    [TimerMode.ShortBreak]: "Short Break",
    [TimerMode.LongBreak]: "Long Break",
  };
  
  const { weeklyData, totalWeeklyMinutes } = useMemo(() => {
    const data: { [key: string]: number } = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - today.getDay());

    let totalMinutes = 0;

    pomodoroSessions.forEach(session => {
        const sessionDate = new Date(session.date + 'T00:00:00'); 
        if(sessionDate >= startOfWeek) {
            const dayName = dayNames[sessionDate.getDay()];
            data[dayName] += session.duration;
            totalMinutes += session.duration;
        }
    });
    
    return {
        weeklyData: Object.entries(data).map(([name, minutes]) => ({ name, minutes })),
        totalWeeklyMinutes: totalMinutes,
    };
  }, [pomodoroSessions]);

  const todayDayName = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'short' }), []);

  return (
    <>
      {isFullScreen ? (
        <div className="fixed inset-0 bg-dark-bg z-50 flex flex-col items-center justify-center p-8 animate-fade-in">
            <button
                onClick={toggleFullScreen}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                aria-label="Tam ekrandan çık"
            >
                <Icon name="X" className="w-8 h-8" />
            </button>
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto" style={{ filter: 'drop-shadow(0 0 20px rgba(123, 92, 255, 0.7))' }}>
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                        className="text-white/10"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                    />
                    <circle
                        className="text-primary"
                        strokeWidth="8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={(2 * Math.PI * 45) - (progress / 100) * (2 * Math.PI * 45)}
                        style={{
                            transform: 'rotate(-90deg)',
                            transformOrigin: '50% 50%',
                            transition: 'stroke-dashoffset 0.5s ease-out'
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl sm:text-7xl font-bold tracking-tighter text-white">{formatTime(timeLeft)}</span>
                    <span className="text-lg text-gray-400 uppercase tracking-widest mt-2">{modeText[mode]}</span>
                </div>
            </div>
            <div className="flex justify-center items-center space-x-6 mt-12">
                <button onClick={resetTimer} className="p-4 rounded-full text-gray-300 bg-white/5 hover:bg-white/10 transition-colors">
                    <Icon name="RefreshCw" className="w-6 h-6" />
                </button>
                <button
                    onClick={handlePlayPauseClick}
                    className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center text-4xl font-bold shadow-lg shadow-primary/40 hover:bg-primary-hover transition-transform transform hover:scale-105"
                >
                    {isActive ? <Icon name="Pause" className="w-10 h-10"/> : <Icon name="Play" className="w-10 h-10"/>}
                </button>
                <button onClick={skipTimer} className="p-4 rounded-full text-gray-300 bg-white/5 hover:bg-white/10 transition-colors">
                    <Icon name="SkipForward" className="w-6 h-6" />
                </button>
            </div>
        </div>
      ) : (
        <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-white/10 h-full flex flex-col">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Pomodoro Timer</h2>
            <div className="flex items-center space-x-2">
                <button onClick={toggleFullScreen} className="text-gray-400 hover:text-primary transition-colors" title="Tam Ekran Modu">
                    <Icon name="Expand" className="w-5 h-5" />
                </button>
                <button onClick={() => setIsSettingsOpen(true)} className="text-gray-400 hover:text-primary transition-colors" title="Ayarlar">
                    <Icon name="Settings" className="w-6 h-6" />
                </button>
            </div>
          </div>

          <div className="text-center my-8 flex-grow flex items-center justify-center">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto" style={{ filter: 'drop-shadow(0 0 10px rgba(123, 92, 255, 0.5))' }}>
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                        className="text-gray-500/10 dark:text-white/10"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                    />
                    <circle
                        className="text-primary"
                        strokeWidth="8"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={(2 * Math.PI * 45) - (progress / 100) * (2 * Math.PI * 45)}
                        style={{
                            transform: 'rotate(-90deg)',
                            transformOrigin: '50% 50%',
                            transition: 'stroke-dashoffset 0.5s ease-out'
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl sm:text-4xl font-bold tracking-tighter">{formatTime(timeLeft)}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">{modeText[mode]}</span>
                </div>
            </div>
          </div>
          
          <div className="flex justify-center items-center space-x-4 mb-4">
            <button onClick={resetTimer} className="p-3 rounded-full text-gray-500 dark:text-gray-300 bg-gray-500/10 hover:bg-gray-500/20 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
              <Icon name="RefreshCw" className="w-5 h-5" />
            </button>
            <button
              onClick={handlePlayPauseClick}
              className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg shadow-primary/40 hover:bg-primary-hover transition-transform transform hover:scale-105"
            >
              {isActive ? <Icon name="Pause" className="w-8 h-8"/> : <Icon name="Play" className="w-8 h-8"/>}
            </button>
            <button onClick={skipTimer} className="p-3 rounded-full text-gray-500 dark:text-gray-300 bg-gray-500/10 hover:bg-gray-500/20 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
              <Icon name="SkipForward" className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-4 px-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold">Günlük Hedef</h3>
              <button onClick={() => setIsGoalModalOpen(true)} className="text-xs text-primary hover:text-primary-hover">
                Hedef Ayarla
              </button>
            </div>
            <div className="relative w-full h-2 bg-gray-500/10 dark:bg-white/5 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-violet-400 transition-all duration-500"
                style={{ width: `${dailyGoalProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {pomodoroGoal.dailyCompleted} / {pomodoroGoal.dailyTarget} pomodoro
              </span>
              <span className="text-xs font-semibold text-primary">{dailyGoalProgress}%</span>
            </div>
          </div>
          
          <div className="mt-auto pt-4 border-t border-white/20 dark:border-white/10">
              <div className="flex justify-between items-baseline mb-2 px-2">
                <h3 className="font-semibold">This Week's Focus</h3>
                <p className="font-bold text-lg text-primary">{totalWeeklyMinutes} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">min</span></p>
              </div>
              <div style={{width: '100%', height: 150}}>
                  <ResponsiveContainer>
                      <BarChart data={weeklyData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                          <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgba(123, 92, 255, 0.6)" />
                              <stop offset="100%" stopColor="rgba(123, 92, 255, 0.2)" />
                            </linearGradient>
                            <linearGradient id="barGradientToday" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgba(123, 92, 255, 1)" />
                              <stop offset="100%" stopColor="rgba(123, 92, 255, 0.5)" />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                          <Tooltip 
                            cursor={{fill: 'rgba(123, 92, 255, 0.1)'}} 
                            contentStyle={{ 
                              backgroundColor: 'rgba(30,30,30,0.8)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px' 
                            }}
                            labelStyle={{color: '#fff'}}
                            formatter={(value: number) => [`${value} min`, 'Focus']}
                          />
                          <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                            {weeklyData.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={entry.name === todayDayName ? 'url(#barGradientToday)' : 'url(#barGradient)'} />
                            ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
        </div>
      )}

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Pomodoro Settings">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Focus (minutes)</label>
            <input type="number" value={tempSettings.focus} onChange={e => setTempSettings({...tempSettings, focus: Number(e.target.value)})} className="mt-1 block w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Short Break (minutes)</label>
            <input type="number" value={tempSettings.shortBreak} onChange={e => setTempSettings({...tempSettings, shortBreak: Number(e.target.value)})} className="mt-1 block w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Long Break (minutes)</label>
            <input type="number" value={tempSettings.longBreak} onChange={e => setTempSettings({...tempSettings, longBreak: Number(e.target.value)})} className="mt-1 block w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Long break after</label>
            <input type="number" value={tempSettings.longBreakInterval} onChange={e => setTempSettings({...tempSettings, longBreakInterval: Number(e.target.value)})} className="mt-1 block w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-md shadow-sm p-2" />
          </div>
          <div className="flex justify-end">
            <button onClick={handleSettingsSave} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover">Save</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isMotivationModalOpen} onClose={() => setIsMotivationModalOpen(false)} title="Motivasyon ister misin?">
        <div className="text-center">
            <p className="mb-6 text-gray-600 dark:text-gray-300">Başlamadan önce küçük bir motivasyon molasına ne dersin?</p>
            <div className="flex justify-center space-x-4">
                <button onClick={handleMotivationNo} className="bg-gray-500/20 px-6 py-2 rounded-lg hover:bg-gray-500/30 font-semibold">Hayır</button>
                <button onClick={handleMotivationYes} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover font-semibold">Evet</button>
            </div>
        </div>
      </Modal>

      <Modal isOpen={isRewardModalOpen} onClose={closeRewardModalAndContinue} title="Harika iş!">
        <div className="text-center">
            <p className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200">Odaklanma seansın tamamlandı!</p>
            
            {lastEarnedRewards && (lastEarnedRewards.tickets > 0 || lastEarnedRewards.spins > 0 || lastEarnedRewards.op > 0) && (
                 <div className="mb-6 p-4 bg-primary/10 rounded-lg">
                    <h3 className="font-bold text-primary mb-2">Kazandığın Ödüller:</h3>
                    <div className="flex justify-center items-center space-x-6">
                        {lastEarnedRewards.op > 0 && (
                            <div className="flex items-center space-x-2">
                                <Icon name="Op" className="w-6 h-6 text-green-400"/>
                                <span className="text-xl font-bold">{lastEarnedRewards.op}</span>
                            </div>
                        )}
                        {lastEarnedRewards.tickets > 0 && (
                            <div className="flex items-center space-x-2">
                                <Icon name="Ticket" className="w-6 h-6 text-primary"/>
                                <span className="text-xl font-bold">{lastEarnedRewards.tickets}</span>
                            </div>
                        )}
                         {lastEarnedRewards.spins > 0 && (
                            <div className="flex items-center space-x-2">
                                <Icon name="RefreshCw" className="w-6 h-6 text-yellow-500"/>
                                <span className="text-xl font-bold">{lastEarnedRewards.spins}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {lastEarnedRewards?.newCard && (
                <div className="mb-6 p-4 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
                    <Icon name="Gift" className="w-8 h-8 mx-auto text-green-500 mb-2"/>
                    <h3 className="font-bold text-green-500">Yeni Kart Kiliti Açıldı!</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">"{lastEarnedRewards.newCard.name}" koleksiyonuna eklendi.</p>
                </div>
            )}

            <p className="mb-6 text-gray-600 dark:text-gray-300">Şimdi bir molayı hak ettin. Ne yapmak istersin?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PostPomodoroCategories.map(cat => (
                    <button key={cat} onClick={() => handleRewardChoice(cat)} className="bg-primary/20 text-primary font-semibold px-4 py-2 rounded-lg hover:bg-primary hover:text-white transition-colors">{cat}</button>
                ))}
            </div>
            <div className="mt-4">
                 <button onClick={() => handleRewardChoice(null)} className="bg-gray-500/20 w-full px-6 py-2 rounded-lg hover:bg-gray-500/30 font-semibold">İlgilenmiyorum</button>
            </div>
            <div className="mt-6 pt-4 border-t border-white/20 dark:border-white/10">
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Mola süresinde rahatlamak için egzersizlerimize göz atın.</p>
                 <button 
                  onClick={handleGoToExercise} 
                  className="w-full flex items-center justify-center p-2 rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors font-semibold"
                >
                    <Icon name="Wind" className="w-4 h-4 mr-2"/>
                    Yenilenme Alanı'na Git
                 </button>
            </div>
        </div>
      </Modal>

      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Hedef Ayarları">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Günlük Hedef (pomodoro sayısı)</label>
            <input 
              type="number" 
              min="0"
              value={tempDailyGoal} 
              onChange={e => setTempDailyGoal(Number(e.target.value))} 
              className="mt-1 block w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-md shadow-sm p-2" 
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Şu an: {pomodoroGoal.dailyCompleted} / {pomodoroGoal.dailyTarget} ({dailyGoalProgress}%)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Haftalık Hedef (pomodoro sayısı)</label>
            <input 
              type="number" 
              min="0"
              value={tempWeeklyGoal} 
              onChange={e => setTempWeeklyGoal(Number(e.target.value))} 
              className="mt-1 block w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-md shadow-sm p-2" 
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Şu an: {pomodoroGoal.weeklyCompleted} / {pomodoroGoal.weeklyTarget} ({weeklyGoalProgress}%)
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <button onClick={() => setIsGoalModalOpen(false)} className="bg-gray-500/20 px-4 py-2 rounded-lg hover:bg-gray-500/30">İptal</button>
            <button onClick={handleGoalSave} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover">Kaydet</button>
          </div>
        </div>
      </Modal>

    </>
  );
};

export default React.memo(PomodoroWidget);