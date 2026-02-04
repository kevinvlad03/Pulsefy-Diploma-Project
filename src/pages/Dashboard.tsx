import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Heart,
  Plus,
  Clock,
  TrendingUp,
  Music2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { usePlayer, type PlayerTrack } from "@/lib/player";

type Track = PlayerTrack;

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const aiRecommendations = [
  { id: 1, title: "Cosmic Journey", artist: "Space Explorers", genre: "Electronic", confidence: 95 },
  { id: 2, title: "Rainy Day Blues", artist: "Jazz Quartet", genre: "Jazz", confidence: 88 },
  { id: 3, title: "Summer Vibes", artist: "Tropical Wave", genre: "Pop", confidence: 92 },
  { id: 4, title: "Dark Matter", artist: "Heavy Synth", genre: "Synthwave", confidence: 85 },
];

const playlists = [
  { id: 1, name: "Chill Vibes", tracks: 45, duration: "3h 20m" },
  { id: 2, name: "Workout Energy", tracks: 32, duration: "2h 15m" },
  { id: 3, name: "Focus Flow", tracks: 28, duration: "2h 5m" },
  { id: 4, name: "Night Drive", tracks: 38, duration: "2h 45m" },
];

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    playTrack,
    togglePlay,
    seek,
    setVolume,
  } = usePlayer();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tracks", search],
    queryFn: async () => {
      const res = await apiFetch(
        `/jamendo/tracks?limit=12${search ? `&search=${encodeURIComponent(search)}` : ""}`
      );
      return res.tracks as Track[];
    },
  });

  const recentTracks = data?.slice(0, 6) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
          Welcome Back
        </h1>
        <p className="text-muted-foreground">Your personal music hub</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-card border-border hover:shadow-glow-primary transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Total Plays</span>
            <Play className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">1,234</p>
          <p className="text-sm text-muted-foreground mt-1">+12% this week</p>
        </Card>

        <Card className="p-6 bg-gradient-card border-border hover:shadow-glow-primary transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Favorites</span>
            <Heart className="h-5 w-5 text-secondary" />
          </div>
          <p className="text-3xl font-bold text-foreground">89</p>
          <p className="text-sm text-muted-foreground mt-1">8 added today</p>
        </Card>

        <Card className="p-6 bg-gradient-card border-border hover:shadow-glow-secondary transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Listening Time</span>
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">42h</p>
          <p className="text-sm text-muted-foreground mt-1">This month</p>
        </Card>

        <Card className="p-6 bg-gradient-card border-border hover:shadow-glow-secondary transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Discovery</span>
            <TrendingUp className="h-5 w-5 text-secondary" />
          </div>
          <p className="text-3xl font-bold text-foreground">156</p>
          <p className="text-sm text-muted-foreground mt-1">New tracks found</p>
        </Card>
      </div>

      {/* Library */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Your Library</h2>
            <p className="text-sm text-muted-foreground">Tap a track to play instantly</p>
          </div>
          <Badge variant="outline" className="text-xs">Jamendo</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search library..."
            className="h-9 max-w-sm"
          />
        </div>
        <Card className="bg-card border-border">
          <div className="divide-y divide-border">
            {isLoading && (
              <div className="p-4 text-sm text-muted-foreground">Loading tracks...</div>
            )}
            {isError && (
              <div className="p-4 text-sm text-destructive">
                Failed to load tracks. Make sure the API is running.
              </div>
            )}
            {!isLoading && !isError && recentTracks.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                No tracks found.
              </div>
            )}
            {recentTracks.map((track) => (
              <div
                key={track.id}
                className="p-4 hover:bg-muted/50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 shrink-0 rounded-md overflow-hidden bg-muted">
                    {track.image_url ? (
                      <img
                        src={track.image_url}
                        alt={track.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <Music2 className="h-6 w-6" />
                      </div>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => playTrack(track, recentTracks)}
                      className="absolute inset-0 m-auto h-9 w-9 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {currentTrack?.id === track.id && isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 ml-0.5" />
                      )}
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{track.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                    {track.license_url && (
                      <p className="text-xs text-muted-foreground">
                        License:{" "}
                        <a
                          href={track.license_url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          {track.license_url}
                        </a>
                      </p>
                    )}
                  </div>
                  <div className="hidden md:block text-sm text-muted-foreground">
                    {track.album || "Single"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDuration(track.duration_sec)}
                  </div>
                  <Button size="icon" variant="ghost">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {currentTrack && (
          <Card className="mt-4 bg-gradient-card border-border p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="h-14 w-14 rounded-md overflow-hidden bg-muted shrink-0">
                  {currentTrack.image_url ? (
                    <img
                      src={currentTrack.image_url}
                      alt={currentTrack.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                      <Music2 className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{currentTrack.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={togglePlay}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Slider
                value={[progress]}
                max={duration || 1}
                step={1}
                onValueChange={(value) => {
                  const next = value[0] ?? 0;
                  seek(next);
                }}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Volume</span>
              <Slider
                value={[Math.round(volume * 100)]}
                onValueChange={(value) => setVolume((value[0] ?? 0) / 100)}
                max={100}
                step={1}
                className="max-w-[180px]"
              />
            </div>
          </Card>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* AI Recommendations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">AI Recommendations</h2>
            <Badge className="bg-primary/10 text-primary border-primary">Powered by AI</Badge>
          </div>
          <Card className="bg-gradient-card border-border">
            <div className="p-6 space-y-4">
              {aiRecommendations.map((track) => (
                <div key={track.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-all group">
                  <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{track.title}</p>
                    <p className="text-sm text-muted-foreground">{track.artist}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{track.genre}</Badge>
                  <div className="text-sm text-secondary font-medium">{track.confidence}%</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Playlists */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Your Playlists</h2>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              New Playlist
            </Button>
          </div>
          <div className="grid gap-4">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="p-6 bg-gradient-card border-border hover:shadow-glow-primary transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Play className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {playlist.tracks} tracks · {playlist.duration}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
