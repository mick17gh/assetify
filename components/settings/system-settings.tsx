import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SystemSettings() {
  return (
    <Card className="border-purple-200 shadow-sm">
      <CardHeader>
        <CardTitle>System Settings</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-purple-900/70">
        Configure replacement timelines, reminder windows, and feature flags including offline mode.
      </CardContent>
    </Card>
  );
}
