import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Download, Play, Wand2 } from "lucide-react";
import { useState } from "react";

const generatedSongs = [
  {
    id: 1,
    title: "AI Creation #42",
    genre: "Electronic",
    tempo: 128,
    style: "Ambient",
    duration: "3:24",
    created: "2 hours ago",
  },
  {
    id: 2,
    title: "Neural Symphony",
    genre: "Classical",
    tempo: 90,
    style: "Orchestral",
    duration: "4:15",
    created: "1 day ago",
  },
];

export default function AIGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Wand2 className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Song Generator
          </h1>
        </div>
        <p className="text-muted-foreground">
          Create unique tracks with artificial intelligence
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Generation Form */}
        <Card className="p-8 bg-gradient-card border-border">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Generate New Track</h2>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground">Track Title</Label>
              <Input
                id="title"
                placeholder="Enter a title or leave blank for auto-generation"
                className="bg-background/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="genre" className="text-foreground">Genre</Label>
                <Select>
                  <SelectTrigger id="genre">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronic">Electronic</SelectItem>
                    <SelectItem value="classical">Classical</SelectItem>
                    <SelectItem value="jazz">Jazz</SelectItem>
                    <SelectItem value="rock">Rock</SelectItem>
                    <SelectItem value="ambient">Ambient</SelectItem>
                    <SelectItem value="hiphop">Hip-Hop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tempo" className="text-foreground">Tempo (BPM)</Label>
                <Input
                  id="tempo"
                  type="number"
                  placeholder="120"
                  className="bg-background/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="style" className="text-foreground">Style</Label>
                <Select>
                  <SelectTrigger id="style">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambient">Ambient</SelectItem>
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="melodic">Melodic</SelectItem>
                    <SelectItem value="atmospheric">Atmospheric</SelectItem>
                    <SelectItem value="rhythmic">Rhythmic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emotion" className="text-foreground">Emotion</Label>
                <Select>
                  <SelectTrigger id="emotion">
                    <SelectValue placeholder="Select emotion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="happy">Happy</SelectItem>
                    <SelectItem value="melancholic">Melancholic</SelectItem>
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="intense">Intense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instruments" className="text-foreground">Instruments</Label>
              <Input
                id="instruments"
                placeholder="e.g., piano, synthesizer, drums"
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-foreground">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="3"
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Additional Instructions</Label>
              <Textarea
                id="description"
                placeholder="Describe any specific elements or characteristics you want in your track..."
                className="bg-background/50 min-h-[100px]"
              />
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90 shadow-glow-primary"
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  Generate Track
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Generated Songs */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Recent Generations</h2>
            <Badge className="bg-secondary/10 text-secondary border-secondary">
              AI Powered
            </Badge>
          </div>

          <div className="space-y-4">
            {generatedSongs.map((song) => (
              <Card key={song.id} className="p-6 bg-gradient-card border-border hover:shadow-glow-primary transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-1">
                      {song.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{song.created}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost">
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Genre</p>
                    <Badge variant="outline">{song.genre}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Style</p>
                    <Badge variant="outline">{song.style}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Tempo</p>
                    <p className="font-medium text-foreground">{song.tempo} BPM</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Duration</p>
                    <p className="font-medium text-foreground">{song.duration}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Info Card */}
          <Card className="p-6 bg-secondary/5 border-secondary">
            <div className="flex gap-3">
              <Sparkles className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">How it works</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our AI analyzes millions of tracks to understand musical patterns, harmonies, and structures. 
                  It then generates original compositions based on your preferences, creating unique tracks that match your specifications.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
