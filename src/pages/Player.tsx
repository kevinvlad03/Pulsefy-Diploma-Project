import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Share2,
  Volume2,
  Repeat,
  Shuffle,
  Music2,
} from "lucide-react";
import { usePlayer } from "@/lib/player";
import { Link } from "react-router-dom";

export default function Player() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    togglePlay,
    seek,
    setVolume,
    next,
    prev,
    isShuffle,
    toggleShuffle,
    repeatMode,
    cycleRepeat,
    queue,
    playTrack,
  } = usePlayer();

  if (!currentTrack) {
    return (
      <div className="space-y-6">
        <Card className="p-10 bg-gradient-card border-border text-center">
          <h1 className="text-2xl font-bold text-foreground mb-3">No track playing</h1>
          <p className="text-muted-foreground mb-6">
            Start a track from your library or Home to see the full player here.
          </p>
          <Link to="/">
            <Button className="bg-primary hover:bg-primary/90">Open Library</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-card border-border overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-8 p-8">
          <div className="relative rounded-xl overflow-hidden bg-muted">
            {currentTrack.image_url ? (
              <img
                src={currentTrack.image_url}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                <Music2 className="h-10 w-10" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="icon"
                className="h-20 w-20 rounded-full bg-primary hover:bg-primary/90 shadow-glow-primary"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2 text-foreground">
                    {currentTrack.title}
                  </h1>
                  <p className="text-xl text-muted-foreground">{currentTrack.artist}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost">
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Album</p>
                  <p className="font-medium text-foreground">{currentTrack.album || "Single"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Genre</p>
                  <Badge className="bg-primary/10 text-primary border-primary">
                    {currentTrack.genre || "Unknown"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Duration</p>
                  <p className="font-medium text-foreground">
                    {formatTime(currentTrack.duration_sec)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <Slider
                value={[progress]}
                onValueChange={(value) => seek(value[0] ?? 0)}
                max={duration || 1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  size="icon"
                  variant="ghost"
                  className={isShuffle ? "text-primary" : ""}
                  onClick={toggleShuffle}
                >
                  <Shuffle className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={prev}>
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  className="h-12 w-12 bg-primary hover:bg-primary/90 shadow-glow-primary"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </Button>
                <Button size="icon" variant="ghost" onClick={next}>
                  <SkipForward className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className={repeatMode !== "off" ? "text-primary" : ""}
                  onClick={cycleRepeat}
                >
                  <Repeat className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center gap-2 w-32">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <Slider
                  value={[Math.round(volume * 100)]}
                  onValueChange={(value) => setVolume((value[0] ?? 0) / 100)}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4 text-foreground">Up Next</h2>
        <Card className="bg-card border-border">
          <div className="divide-y divide-border">
            {queue.map((track) => (
              <div
                key={track.id}
                className="p-4 hover:bg-muted/50 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => playTrack(track, queue)}
                  >
                    {currentTrack.id === track.id && isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{track.title}</p>
                    <p className="text-sm text-muted-foreground">{track.artist}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTime(track.duration_sec)}
                  </div>
                  <Button size="icon" variant="ghost">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
