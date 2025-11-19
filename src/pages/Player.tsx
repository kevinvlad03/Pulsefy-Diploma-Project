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
} from "lucide-react";
import { useState } from "react";
import waveformBg from "@/assets/waveform-bg.jpg";

const similarTracks = [
  { id: 1, title: "Stellar Dreams", artist: "Cosmic Voyager", duration: "4:23" },
  { id: 2, title: "Neon Highway", artist: "Synth Riders", duration: "3:45" },
  { id: 3, title: "Digital Sunset", artist: "Wave Orchestra", duration: "5:12" },
  { id: 4, title: "Aurora Flow", artist: "Nordic Beats", duration: "4:08" },
];

export default function Player() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([70]);
  const [progress, setProgress] = useState([30]);

  return (
    <div className="space-y-8">
      {/* Main Player Card */}
      <Card className="bg-gradient-card border-border overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-8 p-8">
          {/* Waveform Visualization */}
          <div className="relative rounded-xl overflow-hidden">
            <img
              src={waveformBg}
              alt="Waveform"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="icon"
                className="h-20 w-20 rounded-full bg-primary hover:bg-primary/90 shadow-glow-primary"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </Button>
            </div>
          </div>

          {/* Track Info & Controls */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2 text-foreground">
                    Midnight Dreams
                  </h1>
                  <p className="text-xl text-muted-foreground">Luna Eclipse</p>
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
                  <p className="font-medium text-foreground">Nocturnal</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Genre</p>
                  <Badge className="bg-primary/10 text-primary border-primary">
                    Electronic
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Release</p>
                  <p className="font-medium text-foreground">2024</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Duration</p>
                  <p className="font-medium text-foreground">3:45</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 mb-6">
              <Slider
                value={progress}
                onValueChange={setProgress}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>1:08</span>
                <span>3:45</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button size="icon" variant="ghost">
                  <Shuffle className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost">
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  className="h-12 w-12 bg-primary hover:bg-primary/90 shadow-glow-primary"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </Button>
                <Button size="icon" variant="ghost">
                  <SkipForward className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost">
                  <Repeat className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center gap-2 w-32">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Similar Tracks */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-foreground">Similar Tracks</h2>
        <Card className="bg-card border-border">
          <div className="divide-y divide-border">
            {similarTracks.map((track) => (
              <div
                key={track.id}
                className="p-4 hover:bg-muted/50 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{track.title}</p>
                    <p className="text-sm text-muted-foreground">{track.artist}</p>
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
    </div>
  );
}
