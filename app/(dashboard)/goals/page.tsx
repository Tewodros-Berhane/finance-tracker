import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GoalsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Goals</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Your Vantage overview will appear here.
        </p>
      </CardContent>
    </Card>
  );
}
