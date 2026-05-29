import { FileText, Clock, RefreshCw, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ============================================
// STATS CONFIGURATION
// ============================================
const STATS_CONFIG = [
  {
    label: 'Total Reports',
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
    key: 'resolvedReports',
    icon: CheckCircle,
    color: 'text-[#41A52B]',
    bgColor: 'bg-[#41A52B]/25 dark:bg-green-900/20',
    iconBg: 'bg-[#41A52B]',
    borderColor: 'border-[#41A52B] dark:border-green-700',
    hoverLine: 'bg-[#41A52B]',
  },
  {
    label: 'Active Emergencies',
    key: 'emergencyAlerts',
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    iconBg: 'bg-red-500',
    borderColor: 'border-red-200 dark:border-red-700',
    hoverLine: 'bg-red-500',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate trend percentage between current and previous values
 * @param {number} current - Current value
 * @param {object} previous - Previous stats object
 * @param {string} key - Key to compare
 * @returns {object|null} Trend data or null if not available
 */
const calculateTrend = (current, previousStats, key) => {
  if (!previousStats || previousStats[key] === undefined) return null;

  const previous = previousStats[key];
  const diff = current - previous;
  const percentage = previous !== 0 ? Math.round((diff / previous) * 100) : 0;

  return {
    value: diff > 0 ? `+${percentage}%` : `${percentage}%`,
    isUp: diff > 0,
    rawDiff: diff,
  };
};

/**
 * Get pulse animation class based on value
 * @param {number} value - Value to check
 * @returns {boolean} Whether to pulse
 */
const shouldPulse = (value) => value > 0;

// ============================================
// STAT CARD COMPONENT
// ============================================

const StatCard = ({ stat, value, index, previousStats }) => {
  const trend = calculateTrend(value, previousStats, stat.key);
  const Icon = stat.icon;
  const shouldAnimate = shouldPulse(value);

  return (
    <Card
      className={cn(
        "relative overflow-hidden border transition-all duration-300 hover:shadow-lg group",
        stat.bgColor,
        stat.borderColor,
        shouldAnimate && "ring-2 ring-red-500/50 animate-pulse",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <CardContent className="p-3">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-2">
          {/* Label and Value */}
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium mb-1">
              {stat.label}
            </p>
            <p className={cn("text-2xl font-bold", stat.color, shouldAnimate && "animate-pulse")}>
              {value}
            </p>
          </div>

          {/* Icon */}
          <div className={cn("p-2 rounded-md shadow-sm", stat.iconBg)}>
            <Icon className={cn("w-4 h-4 text-white", shouldAnimate && "animate-pulse")} />
          </div>
        </div>

        {/* Trend Indicator */}
        {trend && trend.rawDiff !== 0 && (
          <div className={cn(
            "flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full w-fit",
            trend.isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {trend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}
          </div>
        )}

        {/* Hover Line */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300",
          stat.hoverLine
        )} />
      </CardContent>
    </Card>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * StatsOverview Component
 * Displays a grid of statistics cards with trend indicators
 *
 * @param {object} props
 * @param {object} props.stats - Current statistics object
 * @param {object} props.previousStats - Previous statistics object for trend calculation (optional)
 */
export const StatsOverview = ({ stats, previousStats = null }) => {
  // Filter out stats that don't have values (like NFA which is removed)
  const visibleStats = STATS_CONFIG.filter(stat => stats[stat.key] !== undefined);

  return (
    <div className="mb-6">
      {/* Section Title */}
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Quick Statistics
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4">
        {visibleStats.map((stat, index) => (
          <StatCard
            key={stat.key}
            stat={stat}
            value={stats[stat.key]}
            index={index}
            previousStats={previousStats}
          />
        ))}
      </div>
    </div>
  );
};
