
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TimerMode, PomodoroSettings, PomodoroSession } from '../types.ts';

const POMODORO_STATE_KEY = 'pomodoroState';

interface PomodoroState {
  settings: PomodoroSettings;
  mode: TimerMode;
  timeLeft: number; // Always in seconds
  isActive: boolean;
  cycles: number;
  flowBonusApplied: boolean;
  endTime: number | null; // Timestamp when the current timer should end
}

export const usePomodoro = (
  initialSettings: PomodoroSettings, 
  onFocusSessionComplete: (durationInMinutes: number) => void,
  setFlowModeActive: (isActive: boolean) => void,
  isFlowModeEnabled: boolean
) => {
  const isInitialized = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<Omit<PomodoroState, 'settings'>>(() => {
    try {
      const savedStateRaw = localStorage.getItem(POMODORO_STATE_KEY);
      if (savedStateRaw) {
        const savedState: PomodoroState = JSON.parse(savedStateRaw);
        if (savedState.isActive && savedState.endTime) {
          const remainingTime = savedState.endTime - Date.now();
          if (remainingTime > 0) {
            return {
              ...savedState,
              timeLeft: Math.round(remainingTime / 1000),
            };
          } else {
            // Timer finished while tab was closed
            return {
              ...savedState,
              timeLeft: 0,
              isActive: true, 
            };
          }
        }
        return { ...savedState, isActive: false, endTime: null };
      }
    } catch (e) {
      console.error("Failed to restore pomodoro state", e);
    }
    return {
      mode: TimerMode.Focus,
      timeLeft: initialSettings.focus * 60,
      isActive: false,
      cycles: 0,
      flowBonusApplied: false,
      endTime: null,
    };
  });

  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    try {
      const savedStateRaw = localStorage.getItem(POMODORO_STATE_KEY);
      if (savedStateRaw) {
        const savedState: PomodoroState = JSON.parse(savedStateRaw);
        if (savedState.settings && savedState.settings.focus && savedState.settings.shortBreak) {
          return savedState.settings;
        }
      }
    } catch (e) { /* ignore */ }
    return initialSettings;
  });

  const { mode, timeLeft, isActive, cycles, flowBonusApplied, endTime } = state;

  const updateState = useCallback((updates: Partial<Omit<PomodoroState, 'settings'>>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  useEffect(() => {
    if (isInitialized.current) {
      try {
        const stateToSave: PomodoroState = { ...state, settings };
        localStorage.setItem(POMODORO_STATE_KEY, JSON.stringify(stateToSave));
      } catch (e) {
        console.error("Could not save pomodoro state", e);
      }
    }
  }, [state, settings]);

  const switchMode = useCallback((startNext = false) => {
    let nextMode: TimerMode;

    if (mode === TimerMode.Focus) {
      nextMode = TimerMode.ShortBreak;
    } else if (mode === TimerMode.ShortBreak) {
      nextMode = TimerMode.LongBreak;
    } else { 
      nextMode = TimerMode.Focus;
    }

    const newCycles =
      mode === TimerMode.Focus ? cycles + 1 :
      mode === TimerMode.LongBreak ? 0 :
      cycles;

    const newTimeLeft = settings[nextMode] * 60;

    updateState({
      mode: nextMode,
      timeLeft: newTimeLeft,
      isActive: startNext,
      cycles: newCycles,
      flowBonusApplied: false,
      endTime: startNext ? Date.now() + newTimeLeft * 1000 : null,
    });
  }, [cycles, mode, settings, updateState]);


  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (isActive) {
      intervalRef.current = setInterval(() => {
        setState(prevState => {
          if (!prevState.isActive || !prevState.endTime) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return prevState;
          }
          const remaining = prevState.endTime - Date.now();
          if (remaining <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return { ...prevState, timeLeft: 0 };
          }
          return { ...prevState, timeLeft: Math.round(remaining / 1000) };
        });
      }, 250);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, endTime]);

  useEffect(() => {
    if (isActive && timeLeft <= 0) {
      if (mode === TimerMode.Focus) {
        // Kısa, hoş bir bildirim sesi (base64 encoded sine wave beep)
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.5);
        } catch (e) {
          // Ses çalamazsa sessizce devam et
        }
        onFocusSessionComplete(settings.focus);
        updateState({ isActive: false, endTime: null });
      } else {
        switchMode(false);
      }
    }
  }, [isActive, timeLeft, mode, settings.focus, onFocusSessionComplete, switchMode, updateState]);
  
  useEffect(() => {
    isInitialized.current = true;
  }, []);

  const toggleTimer = useCallback(() => {
    if (isActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      updateState({ isActive: false, endTime: null });
    } else {
      const newEndTime = Date.now() + timeLeft * 1000;
      updateState({ isActive: true, endTime: newEndTime });
    }
  }, [isActive, timeLeft, updateState]);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const newTimeLeft = settings.focus * 60;
    setState({
      mode: TimerMode.Focus,
      timeLeft: newTimeLeft,
      isActive: false,
      cycles: 0,
      flowBonusApplied: false,
      endTime: null,
    });
    localStorage.removeItem(POMODORO_STATE_KEY);
  }, [settings.focus]);

  const skipTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    switchMode(false);
  }, [switchMode]);

  const updateSettings = useCallback((newSettings: Partial<PomodoroSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (!isActive) {
      updateState({ timeLeft: updated[mode] * 60 });
    }
  }, [isActive, mode, settings, updateState]);

  // Watch for initialSettings changes (profile switch) and update settings accordingly
  const prevInitialSettingsRef = useRef(initialSettings);
  useEffect(() => {
    const prev = prevInitialSettingsRef.current;
    const hasChanged =
      prev.focus !== initialSettings.focus ||
      prev.shortBreak !== initialSettings.shortBreak ||
      prev.longBreak !== initialSettings.longBreak ||
      prev.longBreakInterval !== initialSettings.longBreakInterval;

    if (hasChanged) {
      prevInitialSettingsRef.current = initialSettings;
      // Only update immediately if timer is NOT active
      // If timer IS active, the new settings will take effect after the current session
      if (!isActive) {
        updateSettings(initialSettings);
      } else {
        // Update settings state so they take effect after current session ends
        setSettings(initialSettings);
      }
    }
  }, [initialSettings, isActive, updateSettings]);
  
  const triggerFlowMode = useCallback(() => {
    setFlowModeActive(true);
    const bonusSeconds = 10 * 60;
    setState(prevState => {
      const newTimeLeft = prevState.timeLeft + bonusSeconds;
      const newEndTime = prevState.endTime ? prevState.endTime + bonusSeconds * 1000 : Date.now() + newTimeLeft * 1000;
      return {
        ...prevState,
        timeLeft: newTimeLeft,
        endTime: newEndTime,
        flowBonusApplied: true,
      };
    });
    setTimeout(() => {
      setFlowModeActive(false);
    }, 3000);
  }, [setFlowModeActive]);

  useEffect(() => {
    if (flowTimeoutRef.current) {
        clearTimeout(flowTimeoutRef.current);
        flowTimeoutRef.current = null;
    }

    if (isActive && mode === TimerMode.Focus && !flowBonusApplied && isFlowModeEnabled) {
      const initialDuration = settings[mode] * 60;
      const minTime = 30 * 1000;
      const maxTime = initialDuration * 1000 * 0.9;

      if (maxTime > minTime) {
        const randomDelay = Math.floor(Math.random() * (maxTime - minTime) + minTime);
        flowTimeoutRef.current = setTimeout(triggerFlowMode, randomDelay);
      }
    }

    return () => {
      if (flowTimeoutRef.current) {
        clearTimeout(flowTimeoutRef.current);
        flowTimeoutRef.current = null;
      }
    };
  }, [isActive, mode, flowBonusApplied, isFlowModeEnabled, settings, triggerFlowMode]);

  return useMemo(() => ({
    timeLeft,
    mode,
    isActive,
    cycles,
    settings,
    toggleTimer,
    resetTimer,
    skipTimer,
    updateSettings,
  }), [timeLeft, mode, isActive, cycles, settings, toggleTimer, resetTimer, skipTimer, updateSettings]);
};