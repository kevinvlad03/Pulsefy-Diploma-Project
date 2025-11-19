import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Heart, Plus, Clock, TrendingUp } from "lucide-react";

const recentlyPlayed = [
  { id: 1, title: "Midnight Dreams", artist: "Luna Eclipse", album: "Nocturnal", duration: "3:45", plays: "1.2M" },
  { id: 2, title: "Electric Pulse", artist: "Synthwave Masters", album: "Neon Nights", duration: "4:12", plays: "890K" },
  { id: 3, title: "Ocean Waves", artist: "Ambient Collective", album: "Serenity", duration: "5:20", plays: "2.1M" },
  { id: 4, title: "City Lights", artist: "Urban Beats", album: "Metropolis", duration: "3:58", plays: "1.5M" },
];

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

      {/* Recently Played */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-foreground">Recently Played</h2>
        <Card className="bg-card border-border">
          <div className="divide-y divide-border">
            {recentlyPlayed.map((track) => (
              <div key={track.id} className="p-4 hover:bg-muted/50 transition-all group">
                <div className="flex items-center gap-4">
                  <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{track.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <div className="hidden md:block text-sm text-muted-foreground">
                    {track.album}
                  </div>
                  <div className="text-sm text-muted-foreground">{track.duration}</div>
                  <Button size="icon" variant="ghost">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
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
