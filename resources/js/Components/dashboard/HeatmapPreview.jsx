//current heatmap
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MapPin, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { categoryLabels } from '@/Pages/Reports';
import { Link } from '@inertiajs/react';

const categoryConfig = {
  theft: { color: 'bg-amber-500' },
  assault: { color: 'bg-orange-500' },
  vandalism: { color: 'bg-yellow-500' },
  burglary: { color: 'bg-amber-600' },
  other: { color: 'bg-yellow-600' }
};

export const HeatmapPreview = ({ hotspots }) => {
  const maxIncidents = Math.max(...hotspots.map(h => h.incidents), 1);

  const getTopIncidentType = (breakdown) => {
    const entries = Object.entries(breakdown);
    if (entries.length === 0) return { type: 'other', count: 0 };
    return entries.reduce((max, [type, count]) =>
      count > max.count ? { type, count } : max
    , { type: entries[0][0], count: entries[0][1] });
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Incident Hotspots</h3>
          <Link href="/Heatmap" className="text-sm text-[#D4A853] hover:underline flex items-center gap-1">
            View Map
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <TooltipProvider>
          {hotspots.slice(0, 4).map((hotspot) => {
            const topIncident = getTopIncidentType(hotspot.breakdown);
            const config = categoryConfig[topIncident.type] || categoryConfig.other;
            const percentage = (hotspot.incidents / maxIncidents) * 100;
            const topLabel = categoryLabels[topIncident.type] || topIncident.type.replace('_', ' ');

            return (
              <Tooltip key={hotspot.location}>
                <TooltipTrigger asChild>
                  <div className="space-y-1.5 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {hotspot.location}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-[#D4A853] tabular-nums">
                        {hotspot.incidents}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Top: <span className="font-medium text-[#D4A853] capitalize">{topLabel}</span>{' '}
                      <span className="text-amber-600 dark:text-amber-400">({topIncident.count})</span>
                    </div>
                    <div className="relative">
                      <Progress value={percentage} className="h-1.5 bg-muted dark:bg-slate-600" />
                      <div
                        className={cn("absolute top-0 left-0 h-1.5 rounded-full transition-all", config.color)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <div className="text-xs space-y-1">
                    <p className="font-semibold">{hotspot.location}</p>
                    <p className="text-muted-foreground">
                      <span className="text-[#D4A853] font-semibold">{hotspot.incidents}</span> total incidents
                    </p>
                    <div className="pt-1 border-t border-border">
                      <p className="font-medium mb-1">Breakdown:</p>
                      {Object.entries(hotspot.breakdown)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, count]) => (
                          <p key={type} className="text-muted-foreground capitalize">
                            {categoryLabels[type] || type.replace('_', ' ')}:{' '}
                            <span className="text-amber-600 font-medium">{count}</span>
                          </p>
                        ))}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};
