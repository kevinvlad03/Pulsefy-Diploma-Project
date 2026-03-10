import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Heart, Sparkles, Music2, TrendingUp, Wand2, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { usePlayer, type PlayerTrack } from "@/lib/player";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { getToken, getUser } from "@/lib/auth";
import { getDailyOffset, getMixSalt, refreshMixSalt } from "@/lib/recommendations";
import { mixTracksByGenre } from "@/lib/track-mix";

type Track = PlayerTrack;
type RecommendationItem = { id: string };

const playlists = [
  { id: 1, name: "Late Night Drive", tracks: 28, vibe: "Synth / Night" },
  { id: 2, name: "Focus Flow", tracks: 42, vibe: "Lo-fi / Ambient" },
  { id: 3, name: "Morning Boost", tracks: 36, vibe: "Pop / Indie" },
  { id: 4, name: "Deep Work", tracks: 24, vibe: "Minimal / Electronic" },
];

export default function Home() {
  const { currentTrack, isPlaying, playTrack } = usePlayer();
  const user = getUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = getToken();
  const isAuthenticated = Boolean(token);
  const feedKey = "home";
  const [mixSalt, setMixSalt] = useState(() => getMixSalt(feedKey));
  const seed = `${user?.id || user?.email || "anon"}:${feedKey}:${mixSalt}`;
  const limit = isAuthenticated ? 24 : 48;
  const offset = getDailyOffset(seed, limit, 30);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["home-tracks", offset, isAuthenticated],
    queryFn: async () => {
      const res = await apiFetch(`/jamendo/tracks?limit=${limit}&offset=${offset}`);
      return res.tracks as Track[];
    },
  });

  const recommendationsQuery = useQuery({
    queryKey: ["home-recommendations-count"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await apiFetch("/recommendations");
      return (res.recommendations || []) as RecommendationItem[];
    },
  });

  const tracks = useMemo(() => {
    const base = data || [];
    if (isAuthenticated) return base;
    return mixTracksByGenre(base, 24);
  }, [data, isAuthenticated]);
  const searchQueryRaw = searchParams.get("q")?.trim() || "";
  const searchQuery = searchQueryRaw.toLowerCase();
  const visibleTracks = useMemo(() => {
    if (!searchQuery) return tracks;
    return tracks.filter((track) =>
      [track.title, track.artist, track.genre || "", track.album || ""]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery)
    );
  }, [searchQuery, tracks]);
  const continueListening = visibleTracks.slice(0, 4);
  const trending = visibleTracks.slice(8, 14);
  const playQueue = visibleTracks.length ? visibleTracks : continueListening;
  const libraryCount = visibleTracks.length;
  const trendingCount = trending.length;
  const aiDiscoveriesCount = recommendationsQuery.data?.length || 0;

  const handlePlayTrack = (track: Track) => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    playTrack(track, playQueue);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Home</h1>
          <p className="text-muted-foreground mt-2">
            Your all-in-one music hub: discover, play, and generate tracks in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => document.getElementById("library-section")?.scrollIntoView({ behavior: "smooth" })}
          >
            Open Library
          </Button>
          <Link to="/ai-recommendations">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
              AI Picks
            </Button>
          </Link>
          <Link to="/ai-generator">
            <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10">
              Generate a Song
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setMixSalt(refreshMixSalt(feedKey))}
          >
            Refresh Mix
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-card border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Music2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Library</p>
              <p className="text-2xl font-bold text-foreground">{libraryCount} Tracks</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-card border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trending Today</p>
              <p className="text-2xl font-bold text-foreground">{trendingCount} Picks</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-card border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">AI Discoveries</p>
              <p className="text-2xl font-bold text-foreground">
                {isAuthenticated ? `${aiDiscoveriesCount} New` : "Sign In"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {!isAuthenticated && (
        <Card className="p-4 border-primary/40 bg-primary/10">
          <p className="text-sm text-foreground">
            Guest mode: you can browse a multi-genre mix. Sign in to play tracks and save activity.
          </p>
        </Card>
      )}

      {searchQuery && (
        <Card className="p-4 border-border bg-card/70 flex items-center justify-between gap-3">
          <p className="text-sm text-foreground">
            Search results for <span className="font-semibold">&quot;{searchQueryRaw}&quot;</span>: {visibleTracks.length} track(s)
          </p>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            Clear search
          </Button>
        </Card>
      )}

      <Card className="relative overflow-hidden border-primary/30 bg-gradient-card p-6 md:p-7">
        <div className="absolute -right-12 -top-10 h-36 w-36 rounded-full bg-primary/20 blur-2xl" />
        <div className="absolute -left-10 -bottom-14 h-36 w-36 rounded-full bg-secondary/20 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Badge className="bg-primary/15 text-primary border-primary/40 w-fit">AI Studio</Badge>
            <h2 className="text-2xl font-bold text-foreground">Generate your own tracks with MusicGen</h2>
            <p className="text-muted-foreground max-w-2xl">
              Open the AI Generator, write a prompt, and play the result directly in the Pulsefy player bar.
            </p>
          </div>
          <Link to="/ai-generator">
            <Button className="bg-primary hover:bg-primary/90 shadow-glow-primary">
              <Wand2 className="h-4 w-4" />
              Open AI Song Generator
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>

      <div id="library-section">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Continue Listening</h2>
          <Badge variant="outline" className="text-xs">Daily Mix</Badge>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading && (
            <Card className="p-4 bg-card border-border text-sm text-muted-foreground">
              Loading tracks...
            </Card>
          )}
          {isError && (
            <Card className="p-4 bg-card border-border text-sm text-destructive">
              Failed to load tracks.
            </Card>
          )}
          {!isLoading && !isError && continueListening.length === 0 && (
            <Card className="p-4 bg-card border-border text-sm text-muted-foreground">
              {searchQuery ? "No tracks match your search." : "No tracks found."}
            </Card>
          )}
          {continueListening.map((track) => (
            <Card key={track.id} className="p-4 bg-gradient-card border-border group">
              <div className="relative h-40 rounded-lg overflow-hidden bg-muted">
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
                  onClick={() => handlePlayTrack(track)}
                  className="absolute inset-0 m-auto h-10 w-10 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" />
                  )}
                </Button>
              </div>
              <div className="mt-3">
                <p className="font-semibold text-foreground truncate">{track.title}</p>
                <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Featured Playlists</h2>
            <Button size="sm" variant="outline">
              View All
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="p-5 bg-gradient-card border-border hover:shadow-glow-primary transition-all">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Music2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{playlist.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {playlist.tracks} tracks · {playlist.vibe}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Trending Now</h2>
            <Badge className="bg-primary/10 text-primary border-primary">Fresh</Badge>
          </div>
          <Card className="bg-card border-border">
            <div className="divide-y divide-border">
              {trending.map((track) => (
                <div key={track.id} className="p-4 flex items-center gap-4 group hover:bg-muted/50 transition-all">
                  <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
                    {track.image_url ? (
                      <img
                        src={track.image_url}
                        alt={track.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <Music2 className="h-5 w-5" />
                      </div>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handlePlayTrack(track)}
                      className="absolute inset-0 m-auto h-8 w-8 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {currentTrack?.id === track.id && isPlaying ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5 ml-0.5" />
                      )}
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{track.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <Button size="icon" variant="ghost">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
