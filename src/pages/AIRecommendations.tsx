import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Heart, Sparkles, TrendingUp, Clock, Music2 } from "lucide-react";

const recommendations = [
  { id: 1, title: "Ethereal Dreams", artist: "Ambient Waves", genre: "Ambient", mood: "Calm", confidence: 96, bpm: 85 },
  { id: 2, title: "Urban Rhythm", artist: "City Beats", genre: "Hip-Hop", mood: "Energetic", confidence: 92, bpm: 120 },
  { id: 3, title: "Sunset Boulevard", artist: "Jazz Ensemble", genre: "Jazz", mood: "Relaxed", confidence: 89, bpm: 95 },
  { id: 4, title: "Electric Storm", artist: "Synth Masters", genre: "Electronic", mood: "Intense", confidence: 94, bpm: 140 },
  { id: 5, title: "Mountain Echo", artist: "Folk Collective", genre: "Folk", mood: "Peaceful", confidence: 88, bpm: 80 },
  { id: 6, title: "Neon Nights", artist: "Retrowave", genre: "Synthwave", mood: "Nostalgic", confidence: 91, bpm: 110 },
];

const genres = ["All Genres", "Electronic", "Jazz", "Hip-Hop", "Ambient", "Folk", "Synthwave"];
const moods = ["All Moods", "Calm", "Energetic", "Relaxed", "Intense", "Peaceful", "Nostalgic"];

export default function AIRecommendations() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Recommendations
          </h1>
        </div>
        <p className="text-muted-foreground">
          Personalized suggestions powered by machine learning
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-card border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Accuracy</span>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">94.2%</p>
          <p className="text-sm text-muted-foreground mt-1">+2.3% this week</p>
        </Card>

        <Card className="p-6 bg-gradient-card border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Tracks Analyzed</span>
            <Music2 className="h-5 w-5 text-secondary" />
          </div>
          <p className="text-3xl font-bold text-foreground">2,456</p>
          <p className="text-sm text-muted-foreground mt-1">Last 30 days</p>
        </Card>

        <Card className="p-6 bg-gradient-card border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Match Rate</span>
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">87%</p>
          <p className="text-sm text-muted-foreground mt-1">User satisfaction</p>
        </Card>

        <Card className="p-6 bg-gradient-card border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Processing Time</span>
            <Clock className="h-5 w-5 text-secondary" />
          </div>
          <p className="text-3xl font-bold text-foreground">0.8s</p>
          <p className="text-sm text-muted-foreground mt-1">Average latency</p>
        </Card>
      </div>

      {/* Filters and Content */}
      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted">
            <TabsTrigger value="all">All Recommendations</TabsTrigger>
            <TabsTrigger value="new">New For You</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>

          <div className="flex gap-4">
            <Select defaultValue="all-genres">
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre.toLowerCase().replace(" ", "-")}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select defaultValue="all-moods">
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Mood" />
              </SelectTrigger>
              <SelectContent>
                {moods.map((mood) => (
                  <SelectItem key={mood} value={mood.toLowerCase().replace(" ", "-")}>
                    {mood}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          {recommendations.map((track) => (
            <Card key={track.id} className="p-6 bg-gradient-card border-border hover:shadow-glow-primary transition-all group">
              <div className="flex items-center gap-6">
                <Button
                  size="icon"
                  className="h-12 w-12 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all group-hover:shadow-glow-primary"
                >
                  <Play className="h-5 w-5" />
                </Button>

                <div className="flex-1 grid md:grid-cols-6 gap-4 items-center">
                  <div className="md:col-span-2">
                    <p className="font-semibold text-foreground">{track.title}</p>
                    <p className="text-sm text-muted-foreground">{track.artist}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{track.genre}</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className="bg-secondary/10 text-secondary border-secondary">
                      {track.mood}
                    </Badge>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">BPM</p>
                    <p className="font-semibold text-foreground">{track.bpm}</p>
                  </div>

                  <div className="flex items-center justify-end gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">AI Confidence</p>
                      <p className="text-lg font-bold text-primary">{track.confidence}%</p>
                    </div>
                    <Button size="icon" variant="ghost">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="new">
          <Card className="p-12 text-center bg-gradient-card border-border">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">New recommendations coming soon</h3>
            <p className="text-muted-foreground">Check back later for fresh AI-powered suggestions</p>
          </Card>
        </TabsContent>

        <TabsContent value="trending">
          <Card className="p-12 text-center bg-gradient-card border-border">
            <TrendingUp className="h-12 w-12 text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Trending tracks loading</h3>
            <p className="text-muted-foreground">Analyzing listening patterns across the platform</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
