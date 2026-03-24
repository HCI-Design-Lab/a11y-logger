import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  label: string;
  count: number;
  href: string;
  subtitle?: string;
  trend?: string;
  countClassName?: string;
}

export function StatsCard({ label, count, href, subtitle, trend, countClassName }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-2">
        <Link href={href} aria-label={`${label} ${count}`} className="block">
          <dl>
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className={`text-4xl font-bold m-0${countClassName ? ` ${countClassName}` : ''}`}>
              {count}
            </dd>
            {subtitle && <dd className="text-xs text-muted-foreground">{subtitle}</dd>}
            {trend && <dd className="text-xs text-muted-foreground">{trend}</dd>}
          </dl>
        </Link>
      </CardContent>
    </Card>
  );
}
