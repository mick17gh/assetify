import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BranchList() {
  return (
    <Card className="border-purple-200">
      <CardHeader>
        <CardTitle>Branch Visibility Controls</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-purple-900/70">
        Branch managers see only scoped assets, users, and reports. Admins keep cross-branch governance.
      </CardContent>
    </Card>
  );
}
