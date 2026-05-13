import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, RefreshCcw, Play, Pause, Music2, Heart, ListMusic } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { usePlayer, type PlayerTrack } from "@/lib/player";

type RecommendationItem = {
  id: string;
  reason: string;
  created_at: string;
  track: PlayerTrack;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AIRecommendations() {
  const token = getToken();
  const queryClient = useQueryClient();
  const { currentTrack, isPlaying, playTrack } = usePlayer();

  const recommendationsQuery = useQuery({
    queryKey: ["recommendations"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await apiFetch("/recommendations");
      return (res.recommendations || []) as RecommendationItem[];
    },
  });

  const trackLikesQuery = useQuery({
    queryKey: ["track-likes"],
    enabled: Boolean(token),
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
    mutationFn: async ({ track, liked }: { track: PlayerTrack; liked: boolean }) => {
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
      const prev = queryClient.getQueryData(["track-likes"]);
      queryClient.setQueryData<{ track_id: string; audio_url: string }[]>(
        ["track-likes"],
        (old = []) =>
          liked
            ? old.filter((l) => l.audio_url !== track.audio_url)
            : [...old, { track_id: "", audio_url: track.audio_url }]
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(["track-likes"], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["track-likes"] }),
  });

  const refreshMutation = useMutation({
    mutationFn: async () => apiFetch("/recommendations/refresh", { method: "POST" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });

  const items = recommendationsQuery.data || [];
  const queue = useMemo(() => items.map((item) => item.track), [items]);
  const lastRefreshed = items[0]?.created_at;

  if (!token) {
    return (
      <Card className="p-8 bg-gradient-card border-border space-y-4">
        <h1 className="text-3xl font-bold text-foreground">For You</h1>
        <p className="text-muted-foreground">Sign in to get personalized picks based on what you listen to.</p>
        <Link to="/auth">
          <Button className="bg-primary hover:bg-primary/90">Sign in</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            For You
          </h1>
          <p className="text-muted-foreground mt-1">
            Picks based on your listening history.
            {lastRefreshed && (
              <span className="ml-2 text-xs text-muted-foreground/60">
                Updated {timeAgo(lastRefreshed)}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <Button
              variant="outline"
              className="border-primary/40 text-primary hover:bg-primary/10"
              onClick={() => playTrack(queue[0], queue)}
            >
              <ListMusic className="h-4 w-4 mr-2" />
              Play All
            </Button>
          )}
          <Button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
            {refreshMutation.isPending ? "Refreshing…" : "Refresh Picks"}
          </Button>
        </div>
      </div>

      {/* Loading skeleton */}
      {recommendationsQuery.isLoading && (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 bg-gradient-card border-border">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                  <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {recommendationsQuery.isError && (
        <Card className="p-4 bg-card border-border text-sm text-destructive">
          Failed to load recommendations.
        </Card>
      )}

      {/* Empty state */}
      {!recommendationsQuery.isLoading && !recommendationsQuery.isError && items.length === 0 && (
        <Card className="p-8 bg-gradient-card border-border text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-foreground font-semibold">No picks yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Play a few tracks on the Home page, then hit Refresh Picks to generate your first recommendations.
            </p>
          </div>
          <Button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
            {refreshMutation.isPending ? "Refreshing…" : "Generate Picks"}
          </Button>
        </Card>
      )}

      {/* Recommendation cards */}
      {!recommendationsQuery.isLoading && items.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((item, i) => {
            const isActive = currentTrack?.id === item.track.id;
            const isLiked = likedUrls.has(item.track.audio_url);
            return (
              <Card
                key={item.id}
                className={`p-4 bg-gradient-card border-border group cursor-pointer transition-all duration-300 hover:border-primary/40 hover:shadow-glow-primary animate-in fade-in slide-in-from-bottom-3 duration-500 ${
                  isActive ? "border-primary/50 bg-primary/5" : ""
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => playTrack(item.track, queue)}
              >
                <div className="flex items-center gap-4">
                  {/* Artwork */}
                  <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-muted shrink-0">
                    {item.track.image_url ? (
                      <img
                        src={item.track.image_url}
                        alt={item.track.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gradient-card">
                        <Music2 className="h-5 w-5 text-primary/50" />
                      </div>
                    )}
                    <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-200 ${isActive && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                      {isActive && isPlaying
                        ? <Pause className="h-4 w-4 text-white" />
                        : <Play className="h-4 w-4 text-white ml-0.5" />}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isActive ? "text-primary" : "text-foreground"}`}>
                      {item.track.title}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{item.track.artist}</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{item.reason}</p>
                  </div>

                  {/* Right side: genre badge + wave + like */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.track.genre && (
                      <Badge variant="outline" className="hidden md:inline-flex text-xs">
                        {item.track.genre}
                      </Badge>
                    )}

                    {isActive && isPlaying && (
                      <div className="flex items-end gap-[2px] h-4">
                        <span className="w-[2px] bg-primary rounded-full h-1.5 animate-wave-1" />
                        <span className="w-[2px] bg-secondary rounded-full h-3 animate-wave-2" />
                        <span className="w-[2px] bg-primary rounded-full h-4 animate-wave-3" />
                      </div>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      className={`h-8 w-8 transition-all duration-200 ${
                        isLiked
                          ? "text-primary opacity-100"
                          : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        likeMutation.mutate({ track: item.track, liked: isLiked });
                      }}
                      aria-label={isLiked ? "Unlike" : "Like"}
                    >
                      <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      {items.length > 0 && (
        <Card className="p-4 bg-secondary/5 border-secondary/30">
          <div className="flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Picks are based on your most-played genres. Play more tracks and hit Refresh to update them.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
