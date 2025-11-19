import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TestTube, Play, CheckCircle2, XCircle, TrendingUp, BarChart3 } from "lucide-react";
import { useState } from "react";

const testResults = [
  { id: 1, track: "Stellar Dreams", predicted: "Electronic", actual: "Electronic", confidence: 95, status: "valid" },
  { id: 2, track: "Jazz Evening", predicted: "Jazz", actual: "Jazz", confidence: 92, status: "valid" },
  { id: 3, track: "Rock Anthem", predicted: "Rock", actual: "Metal", confidence: 78, status: "invalid" },
  { id: 4, track: "Ambient Flow", predicted: "Ambient", actual: "Ambient", confidence: 88, status: "valid" },
  { id: 5, track: "Hip-Hop Beat", predicted: "Hip-Hop", actual: "Hip-Hop", confidence: 94, status: "valid" },
];

const genreDistribution = [
  { genre: "Electronic", percentage: 25, count: 125 },
  { genre: "Jazz", percentage: 18, count: 90 },
  { genre: "Rock", percentage: 15, count: 75 },
  { genre: "Ambient", percentage: 12, count: 60 },
  { genre: "Hip-Hop", percentage: 20, count: 100 },
  { genre: "Other", percentage: 10, count: 50 },
];

export default function TestLab() {
  const [isTesting, setIsTesting] = useState(false);

  const handleRunTest = () => {
    setIsTesting(true);
    setTimeout(() => setIsTesting(false), 2000);
  };

  const accuracy = testResults.filter(r => r.status === "valid").length / testResults.length * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <TestTube className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Test Lab
          </h1>
        </div>
        <p className="text-muted-foreground">
          Evaluate and optimize AI recommendation quality
        </p>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-card border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Accuracy</span>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{accuracy.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground mt-1">Current model</p>
        </Card>

        <Card className="p-6 bg-gradient-card border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Precision</span>
            <CheckCircle2 className="h-5 w-5 text-secondary" />
          </div>
          <p className="text-3xl font-bold text-foreground">91.5%</p>
          <p className="text-sm text-muted-foreground mt-1">Valid predictions</p>
        </Card>

        <Card className="p-6 bg-gradient-card border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Tests Run</span>
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">1,247</p>
          <p className="text-sm text-muted-foreground mt-1">Total evaluations</p>
        </Card>

        <Card className="p-6 bg-gradient-card border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground">Avg Confidence</span>
            <TrendingUp className="h-5 w-5 text-secondary" />
          </div>
          <p className="text-3xl font-bold text-foreground">89.4%</p>
          <p className="text-sm text-muted-foreground mt-1">Model certainty</p>
        </Card>
      </div>

      <Tabs defaultValue="test" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="test">Run Test</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="distribution">Genre Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Test Configuration */}
            <Card className="p-8 bg-gradient-card border-border">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Test Configuration</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="test-genre" className="text-foreground">Primary Genre</Label>
                  <Select>
                    <SelectTrigger id="test-genre">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronic">Electronic</SelectItem>
                      <SelectItem value="jazz">Jazz</SelectItem>
                      <SelectItem value="rock">Rock</SelectItem>
                      <SelectItem value="ambient">Ambient</SelectItem>
                      <SelectItem value="hiphop">Hip-Hop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="listening-hours" className="text-foreground">
                    Listening History (hours)
                  </Label>
                  <Input
                    id="listening-hours"
                    type="number"
                    placeholder="100"
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favorite-artists" className="text-foreground">
                    Number of Favorite Artists
                  </Label>
                  <Input
                    id="favorite-artists"
                    type="number"
                    placeholder="25"
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-size" className="text-foreground">
                    Test Sample Size
                  </Label>
                  <Select>
                    <SelectTrigger id="test-size">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (10 tracks)</SelectItem>
                      <SelectItem value="medium">Medium (50 tracks)</SelectItem>
                      <SelectItem value="large">Large (100 tracks)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full bg-primary hover:bg-primary/90 shadow-glow-primary"
                  size="lg"
                  onClick={handleRunTest}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <>
                      <TestTube className="mr-2 h-5 w-5 animate-pulse" />
                      Running Test...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" />
                      Run AI Test
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Live Metrics */}
            <Card className="p-8 bg-gradient-card border-border">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Live Metrics</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-background/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Processing Speed</span>
                    <Badge className="bg-primary/10 text-primary border-primary">Real-time</Badge>
                  </div>
                  <p className="text-2xl font-bold text-foreground">0.8ms</p>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-primary rounded-full" />
                  </div>
                </div>

                <div className="p-4 bg-background/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Model Latency</span>
                    <Badge className="bg-secondary/10 text-secondary border-secondary">Optimal</Badge>
                  </div>
                  <p className="text-2xl font-bold text-foreground">45ms</p>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-secondary rounded-full" />
                  </div>
                </div>

                <div className="p-4 bg-background/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">GPU Usage</span>
                    <Badge variant="outline">65%</Badge>
                  </div>
                  <p className="text-2xl font-bold text-foreground">2.4 GB</p>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[65%] bg-gradient-primary rounded-full" />
                  </div>
                </div>

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex gap-3">
                    <TestTube className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">System Status</p>
                      <p className="text-xs text-muted-foreground">
                        All AI models are operational and ready for testing
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results">
          <Card className="bg-card border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Test Results</h2>
                <Badge className="bg-primary/10 text-primary border-primary">
                  {testResults.filter(r => r.status === "valid").length} / {testResults.length} Valid
                </Badge>
              </div>
            </div>

            <div className="divide-y divide-border">
              {testResults.map((result) => (
                <div key={result.id} className="p-6 hover:bg-muted/50 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="flex-shrink-0">
                      {result.status === "valid" ? (
                        <CheckCircle2 className="h-6 w-6 text-secondary" />
                      ) : (
                        <XCircle className="h-6 w-6 text-destructive" />
                      )}
                    </div>

                    <div className="flex-1 grid md:grid-cols-5 gap-4 items-center">
                      <div>
                        <p className="font-medium text-foreground">{result.track}</p>
                        <p className="text-sm text-muted-foreground">Test Track</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Predicted</p>
                        <Badge variant="outline">{result.predicted}</Badge>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Actual</p>
                        <Badge variant="outline">{result.actual}</Badge>
                      </div>

                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                        <p className="text-lg font-semibold text-primary">{result.confidence}%</p>
                      </div>

                      <div className="text-right">
                        <Badge
                          className={
                            result.status === "valid"
                              ? "bg-secondary/10 text-secondary border-secondary"
                              : "bg-destructive/10 text-destructive border-destructive"
                          }
                        >
                          {result.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card className="p-8 bg-gradient-card border-border">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Genre Distribution</h2>
            
            <div className="space-y-4">
              {genreDistribution.map((item) => (
                <div key={item.genre} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{item.genre}</span>
                    <span className="text-muted-foreground">
                      {item.count} tracks ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
