
import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import Icon from './Icon.tsx';
import { DataContext } from '../context/DataContext.tsx';
import Modal from './Modal.tsx';
import { PlaylistPlatform } from '../types.ts';

// --- Type Definitions ---
interface Track {
  id: string;
  title: string;
  artist: { name:string };
  album: { cover_medium: string };
  preview: string;
}

type Status = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
type PlayerMode = 'audio' | 'youtube' | 'spotify';

// --- Helper Functions ---
const getIdentifierFromUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    const urlObject = new URL(url);
    if (urlObject.hostname !== 'archive.org') return null;
    const pathParts = urlObject.pathname.split('/');
    const detailsIndex = pathParts.indexOf('details');
    if (detailsIndex !== -1 && pathParts.length > detailsIndex + 1) {
      return pathParts[detailsIndex + 1];
    }
    return null;
  } catch (e) {
    return null;
  }
};

const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  try {
    const urlObject = new URL(url);
    if (urlObject.hostname === 'youtu.be') {
      return urlObject.pathname.slice(1);
    }
    if (urlObject.hostname.includes('youtube.com')) {
      // Single video: ?v=ID
      const videoId = urlObject.searchParams.get('v');
      if (videoId) return videoId;
      // Embed URL: /embed/ID
      if (urlObject.pathname.startsWith('/embed/')) {
        return urlObject.pathname.split('/embed/')[1]?.split('?')[0] || null;
      }
    }
    return null;
  } catch { return null; }
};

const getYouTubePlaylistId = (url: string): string | null => {
  if (!url) return null;
  try {
    const urlObject = new URL(url);
    if (urlObject.hostname.includes('youtube.com')) {
      return urlObject.searchParams.get('list');
    }
    return null;
  } catch { return null; }
};

const getSpotifyEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    const urlObject = new URL(url);
    if (!urlObject.hostname.includes('spotify.com')) return null;
    // open.spotify.com/track/ID, /album/ID, /playlist/ID, /artist/ID
    const pathParts = urlObject.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
      const type = pathParts[0]; // track, album, playlist, artist
      const id = pathParts[1];
      return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0&t=0`;
    }
    return null;
  } catch { return null; }
};

const detectPlatform = (url: string): PlaylistPlatform => {
  if (!url) return 'custom';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('spotify.com')) return 'spotify';
  return 'custom';
};

const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '00:00';
    const floorSeconds = Math.floor(seconds);
    const mins = Math.floor(floorSeconds / 60);
    const secs = floorSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// --- Component ---
const MusicWidget: React.FC = () => {
  const { addSavedPlaylist, playlistToPlay, setPlaylistToPlay, setGlobalMusicPlayer, setGlobalMusicPlayerControls } = useContext(DataContext);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState({ currentTime: 0, duration: 0 });
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('music-widget-volume');
    return saved ? parseFloat(saved) : 1;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [playerMode, setPlayerMode] = useState<PlayerMode>('audio');
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const lastTrackIdRef = useRef<string | null>(null);
  const currentTrack = tracks.length > 0 ? tracks[currentTrackIndex] : null;

  const playNext = useCallback(() => {
    if (tracks.length > 1) {
        if (isShuffleEnabled) {
            const availableIndices = tracks.map((_, i) => i).filter(i => i !== currentTrackIndex);
            const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            setCurrentTrackIndex(randomIndex);
        } else {
            setCurrentTrackIndex(prevIndex => (prevIndex + 1) % tracks.length);
        }
    }
  }, [tracks.length, isShuffleEnabled, currentTrackIndex]);

  const loadPlaylist = useCallback(async (urlToLoad: string) => {
    if (!urlToLoad) return;
    setErrorMessage('');
    setTracks([]);
    setEmbedUrl(null);
    lastTrackIdRef.current = null;
    setStatus('loading');

    const platform = detectPlatform(urlToLoad);

    // --- YouTube ---
    if (platform === 'youtube') {
      setPlayerMode('youtube');
      const playlistId = getYouTubePlaylistId(urlToLoad);
      const videoId = getYouTubeVideoId(urlToLoad);

      if (playlistId) {
        setEmbedUrl(`https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1&origin=https://www.youtube.com`);
        setStatus('playing');
      } else if (videoId) {
        setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&origin=https://www.youtube.com`);
        setStatus('playing');
      } else {
        setStatus('error');
        setErrorMessage("Geçersiz YouTube URL'si. Video veya playlist linki girin.");
      }
      return;
    }

    // --- Spotify ---
    if (platform === 'spotify') {
      setPlayerMode('spotify');
      const spotifyEmbed = getSpotifyEmbedUrl(urlToLoad);
      if (spotifyEmbed) {
        setEmbedUrl(spotifyEmbed);
        setStatus('playing');
      } else {
        setStatus('error');
        setErrorMessage("Geçersiz Spotify URL'si. Track, album veya playlist linki girin.");
      }
      return;
    }

    // --- Internet Archive (custom) ---
    setPlayerMode('audio');
    const identifier = getIdentifierFromUrl(urlToLoad);
    if (!identifier) {
      setStatus('error');
      setErrorMessage("Geçersiz URL. YouTube, Spotify veya Internet Archive linki girin.");
      return;
    }

    try {
      const response = await fetch(`https://archive.org/metadata/${identifier}`);
      if (!response.ok) throw new Error("Koleksiyon bulunamadı veya sunucu hatası.");
      const data = await response.json();
      
      const audioFiles = data.files?.filter((file: any) => 
        file.format?.includes('MP3') || file.format?.includes('Ogg Vorbis')
      );

      if (!audioFiles || audioFiles.length === 0) {
         setStatus('error');
         setErrorMessage("Bu koleksiyonda çalınabilir ses dosyası bulunamadı.");
         return;
      }

      const fetchedTracks: Track[] = audioFiles.map((file: any, index: number) => ({
        id: file.md5 || `${identifier}-${index}`,
        title: file.title || data.metadata?.title || 'Bilinmeyen Parça',
        artist: { name: file.creator || data.metadata?.creator || 'Bilinmeyen Sanatçı' },
        album: { cover_medium: `https://archive.org/services/get-item-image.php?identifier=${identifier}` },
        preview: `https://archive.org/download/${identifier}/${file.name}`,
      }));

      setTracks(fetchedTracks);
      setCurrentTrackIndex(0);
      setStatus('playing');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || "Liste yüklenirken bir hata oluştu.");
    }
  }, []);

  useEffect(() => {
    if (playlistToPlay) {
      setPlaylistUrl(playlistToPlay.url);
      loadPlaylist(playlistToPlay.url);
      setPlaylistToPlay(null);
    }
  }, [playlistToPlay, loadPlaylist, setPlaylistToPlay]);

  useEffect(() => {
    if (audioRef.current && currentTrack && playerMode === 'audio') {
        if (lastTrackIdRef.current !== currentTrack.id) {
            lastTrackIdRef.current = currentTrack.id;
            audioRef.current.src = currentTrack.preview;
            if (status === 'playing') {
                audioRef.current.play().catch(() => setStatus('paused'));
            }
        }
    }
  }, [currentTrack, status, playerMode]); 

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => playNext();
    const handleTimeUpdate = () => setProgress(prev => ({ ...prev, currentTime: audio.currentTime }));
    const handleLoadedMetadata = () => setProgress({ currentTime: 0, duration: audio.duration });
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [playNext]);

  const handleLoadPlaylistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    loadPlaylist(playlistUrl);
  };

  const handleSavePlaylist = () => {
    if (!playlistUrl.trim()) {
        alert("Lütfen önce bir URL girin.");
        return;
    }
    const platform = detectPlatform(playlistUrl);
    if (platform === 'youtube' || platform === 'spotify') {
      setNewPlaylistName(platform === 'youtube' ? 'YouTube Playlist' : 'Spotify Playlist');
    } else {
      const identifier = getIdentifierFromUrl(playlistUrl);
      setNewPlaylistName(currentTrack?.artist.name || identifier || 'Playlist');
    }
    setIsSaveModalOpen(true);
  };

  const handleConfirmSavePlaylist = () => {
    if (newPlaylistName.trim() && playlistUrl) {
        addSavedPlaylist(newPlaylistName.trim(), playlistUrl);
        setIsSaveModalOpen(false);
        setNewPlaylistName('');
    }
  };

  const togglePlay = () => {
    if (playerMode !== 'audio') return; // YouTube/Spotify controls are in iframe
    if (!audioRef.current || !currentTrack) return;
    if (status === 'playing') {
      audioRef.current.pause();
      setStatus('paused');
    } else {
      audioRef.current.play().then(() => setStatus('playing')).catch(() => {
          setStatus('error');
          setErrorMessage("Medya oynatılamadı. Lütfen tekrar deneyin.");
      });
    }
  };

  const playPrev = () => {
    setCurrentTrackIndex(prevIndex => (prevIndex - 1 + tracks.length) % tracks.length);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) audioRef.current.currentTime = Number(e.target.value);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    localStorage.setItem('music-widget-volume', newVolume.toString());
    if (audioRef.current) audioRef.current.volume = newVolume;
    if (newVolume > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    if (audioRef.current) {
        if (isMuted) { audioRef.current.volume = volume; setIsMuted(false); }
        else { audioRef.current.volume = 0; setIsMuted(true); }
    }
  };
  
  const isLoading = status === 'loading';
  const isAudioPlayerActive = playerMode === 'audio' && tracks.length > 0 && status !== 'loading' && status !== 'error' && !!currentTrack;
  const isEmbedActive = (playerMode === 'youtube' || playerMode === 'spotify') && embedUrl && status === 'playing';
  const isPlayerActive = isAudioPlayerActive || isEmbedActive;
  const isPlaying = status === 'playing';

  // Update global music player state
  useEffect(() => {
    if (isEmbedActive) {
      setGlobalMusicPlayer({
        isPlaying: true,
        currentTrack: {
          title: playerMode === 'youtube' ? 'YouTube' : 'Spotify',
          artist: playerMode === 'youtube' ? 'YouTube Player' : 'Spotify Player',
          cover: null,
        },
        isVisible: true,
      });
    } else if (isAudioPlayerActive && currentTrack) {
      setGlobalMusicPlayer({
        isPlaying: isPlaying,
        currentTrack: { title: currentTrack.title, artist: currentTrack.artist.name, cover: currentTrack.album.cover_medium },
        isVisible: true,
      });
    } else {
      setGlobalMusicPlayer({ isPlaying: false, currentTrack: null, isVisible: false });
    }
  }, [isAudioPlayerActive, isEmbedActive, currentTrack, isPlaying, playerMode, setGlobalMusicPlayer]);

  useEffect(() => {
    setGlobalMusicPlayerControls({
      onPlayPause: playerMode === 'audio' ? togglePlay : null,
      onNext: playerMode === 'audio' ? playNext : null,
      onPrevious: playerMode === 'audio' ? playPrev : null,
    });
  }, [togglePlay, playNext, playPrev, playerMode, setGlobalMusicPlayerControls]);

  const { title: displayTitle, author: displayAuthor, cover: displayCover } = (() => {
    if (status === 'error') return { title: 'Hata Oluştu', author: errorMessage, cover: null };
    if (isLoading) return { title: 'Yükleniyor...', author: 'Lütfen bekleyin...', cover: null };
    if (isEmbedActive) return { title: playerMode === 'youtube' ? 'YouTube Player' : 'Spotify Player', author: 'Embed modunda çalıyor', cover: null };
    if (isAudioPlayerActive && currentTrack) return { title: currentTrack.title, author: currentTrack.artist.name, cover: currentTrack.album.cover_medium };
    return { title: 'Müzik Bekleniyor', author: 'YouTube, Spotify veya Internet Archive', cover: null };
  })();

  return (
    <div className="bg-light-card/60 dark:bg-dark-card/50 backdrop-blur-2xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-white/10 flex flex-col h-full">
      <audio ref={audioRef} />
      
      <h2 className="text-xl font-bold mb-4">Music Player</h2>
      
      {/* YouTube/Spotify Embed Player */}
      {isEmbedActive && embedUrl && (
        <div className="flex-grow flex flex-col items-center justify-center mb-4">
          <iframe
            src={embedUrl}
            width="100%"
            height={playerMode === 'spotify' ? '352' : '280'}
            style={{ border: 'none' }}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
            title={playerMode === 'youtube' ? 'YouTube Player' : 'Spotify Player'}
          />
          {playerMode === 'spotify' && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Tam şarkı dinlemek için Spotify embed'de hesabınıza giriş yapın
            </p>
          )}
        </div>
      )}

      {/* Audio Player (Internet Archive) */}
      {!isEmbedActive && (
        <div className="flex-grow flex flex-col md:flex-row items-center gap-6">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-lg shadow-lg bg-dark-card flex items-center justify-center shrink-0 overflow-hidden">
            {displayCover ? (
                <img src={displayCover} alt="Album Art" className="w-full h-full object-cover" />
            ) : (
              <Icon name="Music" className={`w-12 h-12 ${status === 'error' ? 'text-red-500' : 'text-primary'}`} />
            )}
          </div>

          <div className="w-full flex-1 flex flex-col justify-center text-center md:text-left">
            <p className="font-bold text-2xl truncate" title={displayTitle}>{displayTitle}</p>
            <p className={`text-md truncate mt-1 ${status === 'error' ? 'text-red-400' : 'text-gray-500 dark:text-gray-400'}`} title={displayAuthor}>{displayAuthor}</p>
            
             {isAudioPlayerActive && (
                <div className="mt-4">
                    <input type="range" min="0" max={progress.duration || 0} value={progress.currentTime} onChange={handleSeek} className="w-full" disabled={!isAudioPlayerActive} />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>{formatTime(progress.currentTime)}</span>
                        <span>{formatTime(progress.duration)}</span>
                    </div>
                </div>
            )}

            <div className="flex justify-center items-center space-x-6 my-4">
              <button onClick={() => setIsShuffleEnabled(!isShuffleEnabled)} disabled={!isAudioPlayerActive} className={`text-gray-500 dark:text-gray-400 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed ${isShuffleEnabled ? 'text-primary' : ''}`} title={isShuffleEnabled ? 'Shuffle Açık' : 'Shuffle Kapalı'}>
                <Icon name="Shuffle" className="w-5 h-5" />
              </button>
              <button onClick={playPrev} disabled={!isAudioPlayerActive} className="text-gray-500 dark:text-gray-400 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed">
                <Icon name="SkipBack" className="w-6 h-6" />
              </button>
              <button onClick={togglePlay} disabled={!isAudioPlayerActive} className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/40 hover:bg-primary-hover disabled:opacity-50 disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isPlaying ? <Icon name="Pause" className="w-7 h-7" /> : <Icon name="Play" className="w-7 h-7" />}
              </button>
              <button onClick={playNext} disabled={!isAudioPlayerActive} className="text-gray-500 dark:text-gray-400 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed">
                <Icon name="SkipForward" className="w-6 h-6" />
              </button>
              <button onClick={() => {}} disabled={!isAudioPlayerActive} className="text-gray-500 dark:text-gray-400 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed opacity-50" title="Repeat (Yakında)">
                <Icon name="RefreshCw" className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center gap-4 mt-auto pt-4 border-t border-white/20 dark:border-white/10">
        {playerMode === 'audio' && (
          <div className="flex items-center space-x-2 w-full md:w-1/3">
            <button onClick={toggleMute} className="text-gray-500 dark:text-gray-400 hover:text-primary" title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}>
              <Icon name={isMuted || volume === 0 ? "VolumeX" : "Volume2"} className="w-5 h-5"/>
            </button>
            <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-full" />
          </div>
        )}
        <form onSubmit={handleLoadPlaylistSubmit} className={`w-full ${playerMode === 'audio' ? 'md:w-2/3' : ''}`}>
            <div className="flex">
              <input
                type="text"
                value={playlistUrl}
                onChange={e => setPlaylistUrl(e.target.value)}
                placeholder="YouTube, Spotify veya Internet Archive URL'si..."
                className="w-full bg-gray-500/10 dark:bg-white/5 p-2 rounded-l-md border-transparent focus:border-primary focus:ring-primary text-sm"
                aria-label="Music URL"
              />
              <button type="button" onClick={handleSavePlaylist} className="bg-primary/80 text-white px-3 py-2 hover:bg-primary-hover font-semibold text-sm disabled:bg-gray-400" title="Kaydet" disabled={!isPlayerActive && !playlistUrl.trim()}>
                <Icon name="Save" className="w-4 h-4"/>
              </button>
              <button type="submit" className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary-hover font-semibold text-sm disabled:bg-gray-400" disabled={isLoading}>
                {isLoading ? '...' : 'Yükle'}
              </button>
            </div>
        </form>
      </div>
      <Modal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} title="Playlist Kaydet">
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Playlist Adı</label>
                <input 
                    type="text" 
                    value={newPlaylistName} 
                    onChange={e => setNewPlaylistName(e.target.value)} 
                    className="mt-1 block w-full bg-gray-500/10 dark:bg-white/5 border-transparent rounded-md shadow-sm p-2"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmSavePlaylist(); }}
                />
            </div>
            <div className="flex justify-end space-x-2">
                <button onClick={() => setIsSaveModalOpen(false)} className="bg-gray-500/20 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-500/30">İptal</button>
                <button onClick={handleConfirmSavePlaylist} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover">Kaydet</button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default React.memo(MusicWidget);
