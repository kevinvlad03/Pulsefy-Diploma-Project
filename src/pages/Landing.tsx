import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Music, Sparkles, Waves, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import aiFeature from "@/assets/ai-feature.jpg";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Pulsefy
          </h1>
          <p className="text-xl md:text-2xl text-foreground/90 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
            Next-generation music streaming powered by AI
          </p>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            Discover personalized recommendations, generate unique tracks, and experience music like never before
          </p>
          <div className="flex gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            <Link to="/">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-primary">
                Get Started
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
              Learn More
            </Button>
          </div>
        </div>

        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-hero opacity-40 pointer-events-none" />
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-background to-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-primary bg-clip-text text-transparent">
            Powered by Innovation
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 bg-gradient-card border-border hover:shadow-glow-primary transition-all duration-300 hover:scale-105">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Music className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Vast Music Library</h3>
              <p className="text-muted-foreground">
                Access millions of tracks across all genres with crystal-clear audio quality
              </p>
            </Card>

            <Card className="p-8 bg-gradient-card border-border hover:shadow-glow-primary transition-all duration-300 hover:scale-105">
              <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-6">
                <Sparkles className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">AI Recommendations</h3>
              <p className="text-muted-foreground">
                Get personalized suggestions based on your taste, mood, and listening patterns
              </p>
            </Card>

            <Card className="p-8 bg-gradient-card border-border hover:shadow-glow-primary transition-all duration-300 hover:scale-105">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">AI Song Generation</h3>
              <p className="text-muted-foreground">
                Create unique tracks with our advanced AI engine - from lyrics to full compositions
              </p>
            </Card>

            <Card className="p-8 bg-gradient-card border-border hover:shadow-glow-secondary transition-all duration-300 hover:scale-105">
              <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-6">
                <Waves className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Advanced Visualization</h3>
              <p className="text-muted-foreground">
                Experience your music with stunning waveform visualizations and animations
              </p>
            </Card>

            <Card className="p-8 bg-gradient-card border-border hover:shadow-glow-secondary transition-all duration-300 hover:scale-105 md:col-span-2 lg:col-span-1">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Music className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Seamless Streaming</h3>
              <p className="text-muted-foreground">
                Enjoy uninterrupted playback with adaptive quality and offline mode
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Feature Highlight */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
                AI-Powered Music Discovery
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Our advanced machine learning algorithms analyze your listening habits, preferences, and even your mood to deliver perfectly curated playlists.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                From discovering hidden gems to creating the perfect soundtrack for any moment, Pulsefy's AI understands music like never before.
              </p>
              <Link to="/ai-recommendations">
                <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-glow-secondary">
                  Explore AI Features
                </Button>
              </Link>
            </div>
            <div className="relative">
              <img
                src={aiFeature}
                alt="AI Features"
                className="rounded-2xl shadow-2xl border border-border"
              />
              <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Pulsefy
          </h3>
          <p className="text-muted-foreground mb-6">
            The future of music streaming
          </p>
          <div className="flex gap-8 justify-center text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">About</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
