import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  label: string;
  count: number;
  href: string;
}

export function StatsCard({ label, count, href }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-2">
        <Link href={href} aria-label={`Total ${label} ${count}`} className="block">
          <dl>
            <dt className="text-sm text-muted-foreground w">
              Total
              <br /> {label}
            </dt>
            <dd className="text-4xl font-bold m-0">{count}</dd>
          </dl>
        </Link>
      </CardContent>
    </Card>
  );
}
