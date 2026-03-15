import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image, Megaphone, Loader2, Dna } from 'lucide-react';

interface StatCard {
  label: string;
  value: string | number;
  description: string;
}

const ICONS: Record<string, React.ElementType> = {
  Assets: Image,
  Campaigns: Megaphone,
  'Running Jobs': Loader2,
  'DNA Status': Dna,
};

export function StatCards({ stats }: { stats: StatCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = ICONS[stat.label] ?? Dna;
        return (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
