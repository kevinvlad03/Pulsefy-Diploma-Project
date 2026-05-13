import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type ReactNode, useCallback } from "react";
import { Play, Pause, Heart, Sparkles, Music2, TrendingUp, Mic2, ChevronRight } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { usePlayer, type PlayerTrack } from "@/lib/player";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getToken, getUser } from "@/lib/auth";
import { getDailyOffset, getMixSalt, getPagedOffset, refreshMixSalt } from "@/lib/recommendations";
import { mixTracksByGenre } from "@/lib/track-mix";

type Track = PlayerTrack;
type RecommendationItem = { id: string };
type TracksResponse = {
  tracks: Track[];
  total: number;
  source?: string;
};

const GENRES = [
  { label: "Pop", value: "pop" },
  { label: "Rock", value: "rock" },
  { label: "Electronic", value: "electronic" },
  { label: "Ambient", value: "ambient" },
  { label: "Jazz", value: "jazz" },
  { label: "Classical", value: "classical" },
  { label: "Hip-Hop", value: "hiphop" },
  { label: "Folk", value: "folk" },
  { label: "Metal", value: "metal" },
  { label: "Country", value: "country" },
];

export default function Home() {
  const { currentTrack, isPlaying, playTrack } = usePlayer();
  const user = getUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const token = getToken();
  const isAuthenticated = Boolean(token);
  const feedKey = "home";
  const [mixSalt, setMixSalt] = useState(() => getMixSalt(feedKey));
  const [page, setPage] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState("");
  const searchQueryRaw = searchParams.get("q")?.trim() || "";
  const isSearching = searchQueryRaw.length > 0;
  const seed = `${user?.id || user?.email || "anon"}:${feedKey}:${mixSalt}`;
  const limit = isSearching ? 24 : isAuthenticated ? 30 : 60;
  const baseOffset = getDailyOffset(seed, limit, 30);
  const offset = isSearching ? page * limit : getPagedOffset(baseOffset, page, limit, 30);

  useEffect(() => {
    setPage(0);
  }, [searchQueryRaw, mixSalt, isAuthenticated, selectedGenre]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["home-tracks", searchQueryRaw, offset, limit, isAuthenticated, selectedGenre],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      if (searchQueryRaw) params.set("search", searchQueryRaw);
      if (selectedGenre) params.set("genre", selectedGenre);
      const res = await apiFetch(`/jamendo/tracks?${params.toString()}`);
      return {
        tracks: (res.tracks || []) as Track[],
        total: Number(res.total) || (res.tracks || []).length,
        source: res.source as string | undefined,
      } satisfies TracksResponse;
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

  const recentTracksQuery = useQuery({
    queryKey: ["recent-tracks"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await apiFetch("/listening-events/recent?limit=4");
      return (res.tracks || []) as Track[];
    },
  });

  const trackLikesQuery = useQuery({
    queryKey: ["track-likes"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await apiFetch("/track-likes");
      return (res.liked || []) as { track_id: string; audio_url: string }[];
    },
  });

  const likedUrls = useMemo(
    () => new Set((trackLikesQuery.data || []).map((l) => l.audio_url)),
    [trackLikesQuery.data]
  );

  const likeMutation = useMutation({
    mutationFn: async ({ track, liked }: { track: Track; liked: boolean }) => {
      const payload = {
        track: {
          title: track.title,
          artist: track.artist,
          album: track.album ?? null,
          genre: track.genre ?? null,
          duration_sec: track.duration_sec ?? 0,
          audio_url: track.audio_url,
          cover_url: track.image_url ?? null,
        },
      };
      return apiFetch("/track-likes", {
        method: liked ? "DELETE" : "POST",
        body: JSON.stringify(payload),
      });
    },
    onMutate: async ({ track, liked }) => {
      await queryClient.cancelQueries({ queryKey: ["track-likes"] });
      const prev = queryClient.getQueryData<{ track_id: string; audio_url: string }[]>(["track-likes"]);
      queryClient.setQueryData<{ track_id: string; audio_url: string }[]>(["track-likes"], (old = []) =>
        liked
          ? old.filter((l) => l.audio_url !== track.audio_url)
          : [...old, { track_id: "", audio_url: track.audio_url }]
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined)
        queryClient.setQueryData(["track-likes"], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["track-likes"] });
    },
  });

  const handleToggleLike = useCallback(
    (e: React.MouseEvent, track: Track) => {
      e.stopPropagation();
      if (!isAuthenticated) { navigate("/auth"); return; }
      likeMutation.mutate({ track, liked: likedUrls.has(track.audio_url) });
    },
    [isAuthenticated, likedUrls, likeMutation, navigate]
  );

  const tracks = useMemo(() => {
    const base = data?.tracks || [];
    if (isAuthenticated || isSearching || selectedGenre) return base;
    return mixTracksByGenre(base, Math.min(base.length, 24));
  }, [data?.tracks, isAuthenticated, isSearching, selectedGenre]);

  const recentTracks = recentTracksQuery.data ?? [];
  const continueListening = recentTracks.length > 0 ? recentTracks : tracks.slice(0, 4);
  const continueListeningIsHistory = recentTracks.length > 0;
  const trending = isSearching ? [] : tracks.slice(4, 10);
  const catalogTracks = tracks;
  const playQueue = catalogTracks.length ? catalogTracks : continueListening;
  const libraryCount = data?.total || catalogTracks.length;
  const trendingCount = trending.length;
  const aiDiscoveriesCount = recommendationsQuery.data?.length || 0;
  const hasPrevPage = page > 0;
  const hasNextPage = isSearching
    ? (page + 1) * limit < (data?.total || 0)
    : catalogTracks.length >= Math.min(limit, 24);

  const handlePlayTrack = (track: Track) => {
    if (!isAuthenticated) { navigate("/auth"); return; }
    playTrack(track, playQueue);
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          <Link to="/for-you">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
              For You
            </Button>
          </Link>
          <Link to="/sound-studio">
            <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10">
              Sound Studio
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
        {[
          { label: "Library", value: `${libraryCount} Tracks`, icon: Music2, color: "primary" as const },
          { label: "Trending Today", value: `${trendingCount} Picks`, icon: TrendingUp, color: "secondary" as const },
          { label: "For You", value: isAuthenticated ? `${aiDiscoveriesCount} Picks` : "Sign In", icon: Sparkles, color: "primary" as const },
        ].map((stat, i) => (
          <Card
            key={stat.label}
            className="p-6 bg-gradient-card border-border hover:border-primary/30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color === "primary" ? "bg-primary/10" : "bg-secondary/10"}`}>
                <stat.icon className={`h-5 w-5 ${stat.color === "primary" ? "text-primary" : "text-secondary"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!isAuthenticated && (
        <Card className="p-4 border-primary/40 bg-primary/10">
          <p className="text-sm text-foreground">
            Guest mode: you can browse a multi-genre mix. Sign in to play tracks and save activity.
          </p>
        </Card>
      )}

      {isSearching && (
        <Card className="p-4 border-border bg-card/70 flex items-center justify-between gap-3">
          <p className="text-sm text-foreground">
            Search results for <span className="font-semibold">&quot;{searchQueryRaw}&quot;</span>: {data?.total || 0} track(s)
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
            <Badge className="bg-primary/15 text-primary border-primary/40 w-fit">Sound Studio</Badge>
            <h2 className="text-2xl font-bold text-foreground">Create copyright-free music for your content</h2>
            <p className="text-muted-foreground max-w-2xl">
              Generate ad music, background tracks, and original audio — pick a format, describe your sound, done.
            </p>
          </div>
          <Link to="/sound-studio">
            <Button className="bg-primary hover:bg-primary/90 shadow-glow-primary">
              <Mic2 className="h-4 w-4" />
              Open Sound Studio
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>

      {!isSearching && (
        <div>
          <SectionHeader
            title={continueListeningIsHistory ? "Continue Listening" : "Suggested for You"}
            badge={continueListeningIsHistory ? "Recently played" : "Daily Mix"}
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(isLoading || (isAuthenticated && recentTracksQuery.isLoading)) && Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4 bg-gradient-card border-border">
                <div className="h-40 rounded-lg bg-muted animate-pulse" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                </div>
              </Card>
            ))}
            {isError && (
              <Card className="p-4 bg-card border-border text-sm text-destructive col-span-full">
                Failed to load tracks.
              </Card>
            )}
            {!isLoading && !isError && continueListening.length === 0 && (
              <Card className="p-4 bg-card border-border text-sm text-muted-foreground">No tracks found.</Card>
            )}
            {continueListening.map((track, i) => {
              const isActive = currentTrack?.id === track.id;
              const isLiked = likedUrls.has(track.audio_url);
              return (
                <Card
                  key={track.id}
                  className={`p-4 bg-gradient-card border-border group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-glow-primary ${
                    isActive ? "border-primary/50 shadow-glow-primary" : ""
                  } animate-in fade-in slide-in-from-bottom-3 duration-500`}
                  style={{ animationDelay: `${i * 60}ms` }}
                  onClick={() => handlePlayTrack(track)}
                >
                  <div className="relative h-40 rounded-lg overflow-hidden bg-muted">
                    {track.image_url ? (
                      <img src={track.image_url} alt={track.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-card">
                        <Music2 className="h-8 w-8 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isActive && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                      <div className="h-11 w-11 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-glow-primary">
                        {isActive && isPlaying ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white ml-0.5" />}
                      </div>
                    </div>
                    {isActive && isPlaying && (
                      <div className="absolute top-2 right-2 flex items-end gap-[2px] h-4">
                        <span className="w-[3px] bg-primary rounded-full h-2 animate-wave-1" />
                        <span className="w-[3px] bg-secondary rounded-full h-3 animate-wave-2" />
                        <span className="w-[3px] bg-primary rounded-full h-4 animate-wave-3" />
                        <span className="w-[3px] bg-secondary rounded-full h-2 animate-wave-4" />
                      </div>
                    )}
                    {isAuthenticated && (
                      <button
                        className={`absolute bottom-2 right-2 h-8 w-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                          isLiked ? "bg-primary/90 text-white" : "bg-black/50 text-white/80 hover:bg-primary/80"
                        }`}
                        onClick={(e) => handleToggleLike(e, track)}
                        aria-label={isLiked ? "Unlike" : "Like"}
                      >
                        <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} />
                      </button>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className={`font-semibold truncate ${isActive ? "text-primary" : "text-foreground"}`}>{track.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {!isSearching && trending.length > 0 && (
        <div>
          <SectionHeader title="Trending Now" badge="Fresh" />
          <Card className="bg-card border-border overflow-hidden">
            <div className="divide-y divide-border/60">
              {trending.map((track, i) => {
                const isActive = currentTrack?.id === track.id;
                const isLiked = likedUrls.has(track.audio_url);
                return (
                  <div
                    key={track.id}
                    className={`flex items-center gap-3 px-4 py-3 group cursor-pointer transition-all duration-200 hover:bg-muted/40 ${isActive ? "bg-primary/5" : ""}`}
                    onClick={() => handlePlayTrack(track)}
                  >
                    <div className="w-5 shrink-0 text-center">
                      {isActive && isPlaying ? (
                        <div className="flex items-end justify-center gap-[2px] h-4">
                          <span className="w-[2px] bg-primary rounded-full h-1.5 animate-wave-1" />
                          <span className="w-[2px] bg-secondary rounded-full h-3 animate-wave-2" />
                          <span className="w-[2px] bg-primary rounded-full h-4 animate-wave-3" />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground group-hover:hidden">{i + 1}</span>
                      )}
                      {!(isActive && isPlaying) && (
                        <Play className="h-3 w-3 text-primary hidden group-hover:block mx-auto" />
                      )}
                    </div>
                    <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted shrink-0">
                      {track.image_url ? (
                        <img src={track.image_url} alt={track.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-card">
                          <Music2 className="h-4 w-4 text-primary/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${isActive ? "text-primary" : "text-foreground"}`}>{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    {isAuthenticated && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className={`h-7 w-7 shrink-0 transition-all duration-200 ${
                          isLiked
                            ? "text-primary opacity-100"
                            : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary"
                        }`}
                        onClick={(e) => handleToggleLike(e, track)}
                        aria-label={isLiked ? "Unlike" : "Like"}
                      >
                        <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      <div id="library-section">
        <SectionHeader
          title={isSearching ? "Catalog Results" : "Browse Catalog"}
          badge={selectedGenre ? `${selectedGenre} · ${libraryCount} total` : `${libraryCount} total`}
          action={
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={!hasPrevPage}>
                Prev
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={!hasNextPage}>
                Next
              </Button>
            </div>
          }
        />

        {/* Genre filter chips */}
        {!isSearching && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => setSelectedGenre("")}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                selectedGenre === ""
                  ? "bg-primary text-primary-foreground border-primary shadow-glow-primary"
                  : "border-border bg-card/60 text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              All
            </button>
            {GENRES.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setSelectedGenre(g.value === selectedGenre ? "" : g.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${
                  selectedGenre === g.value
                    ? "bg-primary text-primary-foreground border-primary shadow-glow-primary"
                    : "border-border bg-card/60 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        )}

        <Card className="bg-card border-border">
          <div className="divide-y divide-border">
            {isLoading && Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 rounded-md bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
                </div>
              </div>
            ))}
            {isError && (
              <div className="p-4 text-sm text-destructive">Failed to load tracks.</div>
            )}
            {!isLoading && !isError && catalogTracks.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                {isSearching ? "No tracks match your search." : selectedGenre ? `No ${selectedGenre} tracks found.` : "No tracks found."}
              </div>
            )}
            {catalogTracks.map((track) => {
              const isActive = currentTrack?.id === track.id;
              const isLiked = likedUrls.has(track.audio_url);
              return (
                <div
                  key={track.id}
                  className={`flex items-center gap-4 px-4 py-3 group cursor-pointer transition-all duration-200 hover:bg-muted/40 ${isActive ? "bg-primary/5" : ""}`}
                  onClick={() => handlePlayTrack(track)}
                >
                  <div className="relative h-12 w-12 shrink-0 rounded-md overflow-hidden bg-muted">
                    {track.image_url ? (
                      <img src={track.image_url} alt={track.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-card">
                        <Music2 className="h-5 w-5 text-primary/40" />
                      </div>
                    )}
                    <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-200 ${isActive && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                      {isActive && isPlaying
                        ? <Pause className="h-4 w-4 text-white" />
                        : <Play className="h-4 w-4 text-white ml-0.5" />}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium truncate ${isActive ? "text-primary" : "text-foreground"}`}>{track.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                    <p className="text-xs text-muted-foreground/70 truncate">
                      {track.album || "Single"}{track.genre ? ` · ${track.genre}` : ""}
                    </p>
                  </div>
                  {isActive && isPlaying && (
                    <div className="flex items-end gap-[2px] h-4 shrink-0">
                      <span className="w-[2px] bg-primary rounded-full h-1.5 animate-wave-1" />
                      <span className="w-[2px] bg-secondary rounded-full h-3 animate-wave-2" />
                      <span className="w-[2px] bg-primary rounded-full h-4 animate-wave-3" />
                    </div>
                  )}
                  {isAuthenticated && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`h-8 w-8 shrink-0 transition-all duration-200 ${
                        isLiked
                          ? "text-primary opacity-100"
                          : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary"
                      }`}
                      onClick={(e) => handleToggleLike(e, track)}
                      aria-label={isLiked ? "Unlike" : "Like"}
                    >
                      <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  badge,
  action,
}: {
  title: string;
  badge?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-5">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {badge && (
          <Badge variant="outline" className="text-xs font-normal">
            {badge}
          </Badge>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
