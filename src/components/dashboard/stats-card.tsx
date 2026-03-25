import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  label: string;
  count: number;
  href: string;
  subtitle?: string;
  trend?: string;
  alert?: boolean;
}

export function StatsCard({ label, count, href, subtitle, trend, alert }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-2">
        <Link href={href} aria-label={`${label} ${count}`} className="block">
          <dl>
            <dt className="text-sm text-muted-foreground flex items-center gap-1.5">
              {label}
              {alert && (
                <span
                  className="inline-block w-2 h-2 rounded-full bg-destructive shrink-0"
                  aria-label="alert"
                />
              )}
            </dt>
            <dd className="text-4xl font-bold m-0">{count}</dd>
            {subtitle && <dd className="text-xs text-muted-foreground">{subtitle}</dd>}
            {trend && <dd className="text-xs text-muted-foreground">{trend}</dd>}
          </dl>
        </Link>
      </CardContent>
    </Card>
  );
}
