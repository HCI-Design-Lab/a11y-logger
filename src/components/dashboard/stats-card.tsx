import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  label: string;
  count: number;
}

export function StatsCard({ label, count }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">Total {label}</p>
        <p className="text-4xl font-bold">{count}</p>
      </CardContent>
    </Card>
  );
}
