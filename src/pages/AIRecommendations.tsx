import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, RefreshCcw, Play, Pause, Music2 } from "lucide-react";
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

  const refreshMutation = useMutation({
    mutationFn: async () => apiFetch("/recommendations/refresh", { method: "POST" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });

  const queue = useMemo(
    () => (recommendationsQuery.data || []).map((item) => item.track),
    [recommendationsQuery.data]
  );

  if (!token) {
    return (
      <Card className="p-8 bg-gradient-card border-border space-y-4">
        <h1 className="text-3xl font-bold text-foreground">AI Recommendations</h1>
        <p className="text-muted-foreground">Sign in to view personalized recommendations.</p>
        <Link to="/auth">
          <Button className="bg-primary hover:bg-primary/90">Sign in</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Recommendations
          </h1>
          <p className="text-muted-foreground mt-2">Generated from your listening history.</p>
        </div>
        <Button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="bg-primary hover:bg-primary/90"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          {refreshMutation.isPending ? "Refreshing..." : "Refresh Picks"}
        </Button>
      </div>

      {recommendationsQuery.isLoading && (
        <Card className="p-4 bg-card border-border text-sm text-muted-foreground">
          Loading recommendations...
        </Card>
      )}

      {recommendationsQuery.isError && (
        <Card className="p-4 bg-card border-border text-sm text-destructive">
          Failed to load recommendations.
        </Card>
      )}

      {!recommendationsQuery.isLoading &&
        !recommendationsQuery.isError &&
        (recommendationsQuery.data || []).length === 0 && (
          <Card className="p-6 bg-card border-border space-y-3">
            <p className="text-foreground font-medium">No recommendations yet.</p>
            <p className="text-sm text-muted-foreground">
              Play tracks from Home or Dashboard, then refresh picks.
            </p>
          </Card>
        )}

      <div className="grid gap-3">
        {(recommendationsQuery.data || []).map((item, i) => {
          const isActive = currentTrack?.id === item.track.id;
          return (
            <Card
              key={item.id}
              className={`p-4 bg-gradient-card border-border group cursor-pointer transition-all duration-300 hover:border-primary/40 hover:shadow-glow-primary animate-in fade-in slide-in-from-bottom-3 duration-500 ${
                isActive ? "border-primary/50 bg-primary/5" : ""
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => playTrack(item.track, queue)}
            >
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-muted shrink-0">
                  {item.track.image_url ? (
                    <img src={item.track.image_url} alt={item.track.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-card">
                      <Music2 className="h-5 w-5 text-primary/50" />
                    </div>
                  )}
                  <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-200 ${isActive && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                    {isActive && isPlaying ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white ml-0.5" />}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${isActive ? "text-primary" : "text-foreground"}`}>{item.track.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{item.track.artist}</p>
                  <p className="text-xs text-muted-foreground/80 mt-0.5 line-clamp-1">{item.reason}</p>
                </div>

                {item.track.genre && (
                  <Badge variant="outline" className="hidden md:inline-flex shrink-0 text-xs">
                    {item.track.genre}
                  </Badge>
                )}

                {isActive && isPlaying && (
                  <div className="flex items-end gap-[2px] h-4 shrink-0">
                    <span className="w-[2px] bg-primary rounded-full h-1.5 animate-wave-1" />
                    <span className="w-[2px] bg-secondary rounded-full h-3 animate-wave-2" />
                    <span className="w-[2px] bg-primary rounded-full h-4 animate-wave-3" />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-4 bg-secondary/5 border-secondary">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-secondary mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Recommendations prioritize genres you listen to and tracks you have not played yet.
          </p>
        </div>
      </Card>
    </div>
  );
}
