import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type PlayerTrack = {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  duration_sec: number;
  genre: string | null;
  audio_url?: string | null;
  image_url?: string | null;
  license_url?: string | null;
};

type RepeatMode = "off" | "one" | "all";

type PlayerContextValue = {
  queue: PlayerTrack[];
  currentTrack: PlayerTrack | null;
  currentIndex: number;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  setQueueAndPlay: (tracks: PlayerTrack[], index: number) => void;
  togglePlay: () => void;
  playTrack: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  seek: (seconds: number) => void;
  setVolume: (value: number) => void;
  next: () => void;
  prev: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<PlayerTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");

  const currentTrack = useMemo(() => {
    if (currentIndex < 0 || currentIndex >= queue.length) return null;
    return queue[currentIndex];
  }, [queue, currentIndex]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.audio_url) return;

    audio.src = currentTrack.audio_url;
    audio.currentTime = 0;
    setProgress(0);
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [currentTrack]);

  const setQueueAndPlay = useCallback((tracks: PlayerTrack[], index: number) => {
    setQueue(tracks);
    setCurrentIndex(index);
  }, []);

  const playTrack = useCallback(
    (track: PlayerTrack, nextQueue?: PlayerTrack[]) => {
      if (!track.audio_url) return;
      if (nextQueue && nextQueue.length) {
        const idx = nextQueue.findIndex((item) => item.id === track.id);
        setQueue(nextQueue);
        setCurrentIndex(idx >= 0 ? idx : 0);
        return;
      }
      const idx = queue.findIndex((item) => item.id === track.id);
      if (idx >= 0) {
        setCurrentIndex(idx);
        return;
      }
      setQueue([track]);
      setCurrentIndex(0);
    },
    [queue]
  );

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.audio_url) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [currentTrack, isPlaying]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setProgress(seconds);
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(value);
  }, []);

  const next = useCallback(
    (auto = false) => {
      if (!queue.length) return;
      if (isShuffle) {
        const nextIndex = Math.floor(Math.random() * queue.length);
        setCurrentIndex(nextIndex);
        return;
      }
      if (currentIndex < queue.length - 1) {
        setCurrentIndex(currentIndex + 1);
        return;
      }
      if (repeatMode === "all" || auto) {
        setCurrentIndex(0);
      }
    },
    [currentIndex, isShuffle, queue.length, repeatMode]
  );

  const prev = useCallback(() => {
    if (!queue.length) return;
    if (progress > 2) {
      seek(0);
      return;
    }
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      return;
    }
    if (repeatMode === "all") {
      setCurrentIndex(queue.length - 1);
    }
  }, [currentIndex, progress, queue.length, repeatMode, seek]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleLoaded = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => setIsPlaying(false));
        return;
      }
      if (isShuffle) {
        next(true);
        return;
      }
      if (repeatMode === "all") {
        next(true);
        return;
      }
      if (currentIndex < queue.length - 1) {
        next(true);
        return;
      }
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentIndex, isShuffle, next, queue.length, repeatMode]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((prev) => (prev === "off" ? "all" : prev === "all" ? "one" : "off"));
  }, []);

  const value = useMemo(
    () => ({
      queue,
      currentTrack,
      currentIndex,
      isPlaying,
      progress,
      duration,
      volume,
      isShuffle,
      repeatMode,
      setQueueAndPlay,
      togglePlay,
      playTrack,
      seek,
      setVolume,
      next,
      prev,
      toggleShuffle,
      cycleRepeat,
    }),
    [
      queue,
      currentTrack,
      currentIndex,
      isPlaying,
      progress,
      duration,
      volume,
      isShuffle,
      repeatMode,
      setQueueAndPlay,
      togglePlay,
      playTrack,
      seek,
      setVolume,
      next,
      prev,
      toggleShuffle,
      cycleRepeat,
    ]
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" />
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return ctx;
};
