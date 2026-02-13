import React, { useState } from 'react';
import Icon from './Icon';

interface MiniPlayerProps {
  isPlaying: boolean;
  currentTrack: {
    title: string;
    artist: string;
    cover: string | null;
  } | null;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({
  isPlaying,
  currentTrack,
  onPlayPause,
  onNext,
  onPrevious,
  onClose,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!currentTrack) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-hover"
          title="Mini Player'ı Aç"
        >
          <Icon name="Music" className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-light-card/95 dark:bg-dark-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Şu An Çalıyor</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-500 dark:text-gray-400 hover:text-primary"
            title="Küçült"
          >
            <Icon name="ChevronDown" className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-red-500"
            title="Kapat"
          >
            <Icon name="X" className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-dark-card flex items-center justify-center shrink-0 overflow-hidden">
          {currentTrack.cover ? (
            <img src={currentTrack.cover} alt="Album Art" className="w-full h-full object-cover" />
          ) : (
            <Icon name="Music" className="w-6 h-6 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" title={currentTrack.title}>
            {currentTrack.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={currentTrack.artist}>
            {currentTrack.artist}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={onPrevious}
          className="text-gray-500 dark:text-gray-400 hover:text-primary"
          title="Önceki"
        >
          <Icon name="SkipBack" className="w-5 h-5" />
        </button>
        <button
          onClick={onPlayPause}
          className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-hover"
          title={isPlaying ? 'Duraklat' : 'Oynat'}
        >
          {isPlaying ? <Icon name="Pause" className="w-5 h-5" /> : <Icon name="Play" className="w-5 h-5" />}
        </button>
        <button
          onClick={onNext}
          className="text-gray-500 dark:text-gray-400 hover:text-primary"
          title="Sonraki"
        >
          <Icon name="SkipForward" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(MiniPlayer);
