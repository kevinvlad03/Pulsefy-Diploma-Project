import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

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
  const lastProgressBucketRef = useRef<string | null>(null);
  const startLoggedRef = useRef<string | null>(null);
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

  const logListeningEvent = useCallback(
    async (track: PlayerTrack, secondsListened: number) => {
      if (!getToken()) return;
      const audioUrl = track.audio_url;
      if (!audioUrl) return;
      const payload = {
        trackId: isUuid(track.id) ? track.id : undefined,
        secondsListened: Math.max(0, Math.floor(secondsListened)),
        track: {
          title: track.title,
          artist: track.artist,
          album: track.album,
          genre: track.genre,
          duration_sec: Math.max(0, Math.floor(track.duration_sec || 0)),
          audio_url: audioUrl,
          cover_url: track.image_url,
        },
      };

      try {
        await apiFetch("/listening-events", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } catch {
        // Keep playback resilient if telemetry fails.
      }
    },
    []
  );

  const setQueueAndPlay = useCallback((tracks: PlayerTrack[], index: number) => {
    setQueue(tracks);
    setCurrentIndex(index);
  }, []);

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

  const playTrack = useCallback(
    (track: PlayerTrack, nextQueue?: PlayerTrack[]) => {
      if (!track.audio_url) return;
      if (currentTrack?.id === track.id) {
        togglePlay();
        return;
      }
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
    [currentTrack, queue, togglePlay]
  );

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
      if (currentTrack) {
        void logListeningEvent(currentTrack, duration || progress);
      }
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
  }, [currentIndex, currentTrack, duration, isShuffle, logListeningEvent, next, progress, queue.length, repeatMode]);

  useEffect(() => {
    if (!currentTrack?.audio_url) return;
    if (startLoggedRef.current === currentTrack.id) return;
    startLoggedRef.current = currentTrack.id;
    lastProgressBucketRef.current = null;
    void logListeningEvent(currentTrack, 0);
  }, [currentTrack, logListeningEvent]);

  useEffect(() => {
    if (!currentTrack?.audio_url || !isPlaying) return;
    const bucket = Math.floor(progress / 30);
    const bucketKey = `${currentTrack.id}:${bucket}`;
    if (progress <= 0 || lastProgressBucketRef.current === bucketKey) return;
    if (progress % 30 > 0.8) return;
    lastProgressBucketRef.current = bucketKey;
    void logListeningEvent(currentTrack, progress);
  }, [currentTrack, isPlaying, logListeningEvent, progress]);

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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}
