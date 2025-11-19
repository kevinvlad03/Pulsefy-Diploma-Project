import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Settings, Users, Music, BarChart3, Cpu, HardDrive, Activity, Search } from "lucide-react";

const systemMetrics = [
  { label: "CPU Usage", value: "45%", status: "normal", icon: Cpu },
  { label: "Memory", value: "6.2 GB / 16 GB", status: "normal", icon: HardDrive },
  { label: "Network", value: "124 MB/s", status: "normal", icon: Activity },
  { label: "Active Users", value: "1,247", status: "high", icon: Users },
];

const recentUsers = [
  { id: 1, name: "Alex Johnson", email: "alex@example.com", status: "active", joined: "2024-01-15" },
  { id: 2, name: "Sarah Williams", email: "sarah@example.com", status: "active", joined: "2024-02-20" },
  { id: 3, name: "Mike Chen", email: "mike@example.com", status: "inactive", joined: "2023-11-10" },
  { id: 4, name: "Emma Davis", email: "emma@example.com", status: "active", joined: "2024-03-05" },
];

const contentStats = [
  { label: "Total Songs", value: "125,847", change: "+1,234" },
  { label: "Artists", value: "8,942", change: "+89" },
  { label: "Albums", value: "15,623", change: "+156" },
  { label: "Playlists", value: "45,231", change: "+423" },
];

export default function Admin() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Admin Panel
          </h1>
        </div>
        <p className="text-muted-foreground">System management and monitoring</p>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {systemMetrics.map((metric) => (
          <Card key={metric.label} className="p-6 bg-gradient-card border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">{metric.label}</span>
              <metric.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground mb-2">{metric.value}</p>
            <Badge
              className={
                metric.status === "normal"
                  ? "bg-secondary/10 text-secondary border-secondary"
                  : "bg-primary/10 text-primary border-primary"
              }
            >
              {metric.status}
            </Badge>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          {/* Content Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {contentStats.map((stat) => (
              <Card key={stat.label} className="p-6 bg-gradient-card border-border">
                <p className="text-muted-foreground mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                <p className="text-sm text-secondary">{stat.change} this week</p>
              </Card>
            ))}
          </div>

          {/* Content Management */}
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Content Management</h2>
              <div className="flex gap-2">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  Add Song
                </Button>
                <Button size="sm" variant="outline">
                  Import Batch
                </Button>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search songs, artists, albums..."
                className="pl-10 bg-background/50"
              />
            </div>

            <div className="text-center py-12 text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Search for content to manage</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="bg-card border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">User Management</h2>
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  <Users className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>

            <div className="divide-y divide-border">
              {recentUsers.map((user) => (
                <div key={user.id} className="p-6 hover:bg-muted/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Joined</p>
                        <p className="text-sm font-medium text-foreground">{user.joined}</p>
                      </div>
                      <Badge
                        className={
                          user.status === "active"
                            ? "bg-secondary/10 text-secondary border-secondary"
                            : "bg-muted text-muted-foreground border-border"
                        }
                      >
                        {user.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Manage
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-12 text-center bg-gradient-card border-border">
            <BarChart3 className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2 text-foreground">Analytics Dashboard</h3>
            <p className="text-muted-foreground mb-6">
              Comprehensive analytics and insights coming soon
            </p>
            <Button className="bg-primary hover:bg-primary/90">
              View Reports
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-8 bg-gradient-card border-border">
              <h2 className="text-xl font-bold mb-6 text-foreground">System Health</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-secondary animate-pulse" />
                    <span className="text-foreground">Database</span>
                  </div>
                  <Badge className="bg-secondary/10 text-secondary border-secondary">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-secondary animate-pulse" />
                    <span className="text-foreground">API Services</span>
                  </div>
                  <Badge className="bg-secondary/10 text-secondary border-secondary">Operational</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-secondary animate-pulse" />
                    <span className="text-foreground">AI Engine</span>
                  </div>
                  <Badge className="bg-secondary/10 text-secondary border-secondary">Running</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-secondary animate-pulse" />
                    <span className="text-foreground">Storage</span>
                  </div>
                  <Badge className="bg-secondary/10 text-secondary border-secondary">Available</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-gradient-card border-border">
              <h2 className="text-xl font-bold mb-6 text-foreground">Performance Metrics</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Request Latency</span>
                    <span className="text-sm font-medium text-foreground">23ms</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-1/4 bg-secondary rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Uptime</span>
                    <span className="text-sm font-medium text-foreground">99.98%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-primary rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">AI Processing</span>
                    <span className="text-sm font-medium text-foreground">0.8s avg</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-primary rounded-full" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
