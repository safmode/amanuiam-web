import { FileText, Clock, RefreshCw, CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const StatsOverview = ({ stats, previousStats = null }) => {
  const calculateTrend = (current, previous, key) => {
    if (!previousStats || !previous[key]) return null;
    const diff = current - previous[key];
    const percentage = previous[key] !== 0 ? Math.round((diff / previous[key]) * 100) : 0;
    return {
      value: diff > 0 ? `+${percentage}%` : `${percentage}%`,
      isUp: diff > 0,
      rawDiff: diff,
    };
  };

  const statsConfig = [
    {
      label: 'Total Reports',
      value: stats.totalReports,
      key: 'totalReports',
      icon: FileText,
      color: 'text-[#32B6AD]',
      bgColor: 'bg-white dark:bg-slate-800',
      iconBg: 'bg-[#32B6AD]',
      borderColor: 'border-[#32B6AD]',
      hoverLine: 'bg-[#32B6AD]',
    },
    {
      label: 'Pending',
      value: stats.pendingReports,
      key: 'pendingReports',
      icon: Clock,
      color: 'text-[#D5A642]',
      bgColor: 'bg-[#F6EBCA] dark:bg-amber-900/20',
      iconBg: 'bg-[#D5A642]',
      borderColor: 'border-[#D5A642] dark:border-amber-700',
      hoverLine: 'bg-[#D5A642]',
    },
    {
      label: 'In Progress',
      value: stats.inProgressReports,
      key: 'inProgressReports',
      icon: RefreshCw,
      color: 'text-[#60A8FA]',
      bgColor: 'bg-[#DAEEFE] dark:bg-blue-900/20',
      iconBg: 'bg-[#60A8FA]',
      borderColor: 'border-[#60A8FA] dark:border-blue-700',
      hoverLine: 'bg-[#60A8FA]',
    },
    {
      label: 'Resolved',
      value: stats.resolvedReports,
      key: 'resolvedReports',
      icon: CheckCircle,
      color: 'text-[#41A52B]',
      bgColor: 'bg-[#41A52B]/25 dark:bg-green-900/20',
      iconBg: 'bg-[#41A52B]',
      borderColor: 'border-[#41A52B] dark:border-green-700',
      hoverLine: 'bg-[#41A52B]',
    },
    {
      label: 'NFA',
      value: stats.nfaReports,
      key: 'nfaReports',
      icon: XCircle,
      color: 'text-[#5F6368] dark:text-gray-300',
      bgColor: 'bg-[#E9E9E9] dark:bg-slate-700',
      iconBg: 'bg-[#5F6368]',
      borderColor: 'border-[#5F6368] dark:border-slate-600',
      hoverLine: 'bg-[#5F6368]',
    },
    {
      label: 'Active Emergencies',
      value: stats.emergencyAlerts,
      key: 'emergencyAlerts',
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      iconBg: 'bg-red-500',
      borderColor: 'border-red-200 dark:border-red-700',
      hoverLine: 'bg-red-500',
      pulse: stats.emergencyAlerts > 0,
    },
  ];

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Quick Statistics
      </h2>
      <div className="grid grid-cols-6 gap-4">
        {statsConfig.map((stat, index) => {
          const trend = calculateTrend(stat.value, previousStats, stat.key);
          const Icon = stat.icon;

          return (
            <Card
              key={stat.label}
              className={cn(
                "relative overflow-hidden border transition-all duration-300 hover:shadow-lg group",
                stat.bgColor,
                stat.borderColor,
                stat.pulse && "ring-2 ring-red-500/50 animate-pulse",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground font-medium mb-1">
                      {stat.label}
                    </p>
                    <p className={cn("text-2xl font-bold", stat.color, stat.pulse && "animate-pulse")}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={cn("p-2 rounded-md shadow-sm", stat.iconBg)}>
                    <Icon className={cn("w-4 h-4 text-white", stat.pulse && "animate-pulse")} />
                  </div>
                </div>

                {trend && trend.rawDiff !== 0 && (
                  <div className={cn(
                    "flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full w-fit",
                    trend.isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {trend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {trend.value}
                  </div>
                )}

                <div className={cn(
                  "absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300",
                  stat.hoverLine
                )} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
