import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  label: string;
  count: number;
}

export function StatsCard({ label, count }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <dl>
          <dt className="text-sm text-muted-foreground w">
            Total
            <br /> {label}
          </dt>
          <dd className="text-4xl font-bold m-0">{count}</dd>
        </dl>
      </CardContent>
    </Card>
  );
}
