import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Settings</h2>
        <p className="text-muted-foreground mt-1">
          Configure application preferences and account details.
        </p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Active standalone account information for this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="rounded-md border p-3 bg-secondary/20">
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium">{user?.name ?? "Unknown user"}</p>
            </div>
            <div className="rounded-md border p-3 bg-secondary/20">
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="font-medium capitalize">{user?.role ?? "user"}</p>
            </div>
            <div className="rounded-md border p-3 bg-secondary/20">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email ?? "Not provided"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Application Preferences</CardTitle>
          <CardDescription>
            General settings for the application interface.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="notifications" className="flex flex-col space-y-1">
              <span>Enable Notifications</span>
              <span className="font-normal text-xs text-muted-foreground">Receive alerts for new survey submissions.</span>
            </Label>
            <Switch id="notifications" defaultChecked />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="offline" className="flex flex-col space-y-1">
              <span>Offline Mode</span>
              <span className="font-normal text-xs text-muted-foreground">Cache data locally when internet is unavailable.</span>
            </Label>
            <Switch id="offline" defaultChecked />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="location" className="flex flex-col space-y-1">
              <span>High Accuracy GPS</span>
              <span className="font-normal text-xs text-muted-foreground">Use precise location tracking for household tagging.</span>
            </Label>
            <Switch id="location" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
