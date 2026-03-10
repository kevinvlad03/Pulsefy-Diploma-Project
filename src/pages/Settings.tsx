import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUser } from "@/lib/auth";

export default function Settings() {
  const user = getUser();

  if (!user) {
    return (
      <Card className="p-8 bg-gradient-card border-border space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Sign in to access account settings.</p>
        <Link to="/auth">
          <Button className="bg-primary hover:bg-primary/90">Sign in</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences.</p>
      </div>

      <Card className="p-6 bg-gradient-card border-border">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Account</p>
            <p className="text-lg font-semibold text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Badge variant="outline">Active</Badge>
        </div>
      </Card>

      <Card className="p-6 bg-card border-border space-y-2">
        <p className="font-semibold text-foreground">More options</p>
        <p className="text-sm text-muted-foreground">
          Notification, privacy, and playback preference controls can be added here next.
        </p>
      </Card>
    </div>
  );
}
