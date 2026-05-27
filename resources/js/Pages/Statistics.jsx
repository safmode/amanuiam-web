import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import { router, usePage } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download, Calendar, ChevronDown, TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, LineChart, Line, Tooltip, Legend } from 'recharts';
import 'leaflet/dist/leaflet.css';

// Simple Dropdown component
const SimpleDropdown = ({ isOpen, onClose, trigger, children }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={dropdownRef}>
      {trigger}
      {isOpen && (
        <div className={`absolute top-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 z-50 min-w-[280px]`}>
          {children}
        </div>
      )}
    </div>
  );
};

// Category labels matching your database values
export const categoryLabels = {
    theft: 'Theft/Robbery',
    harassment: 'Harassment',
    vandalism: 'Vandalism',
    fire_hazard: 'Fire Hazard',
    suspiciousActivity: 'Suspicious Activity',
    facility_issue: 'Facility Issue',
    wildAnimal: 'Wild Animal',
    trespassing: 'Trespassing',
    emergency_alert: 'Emergency Alert',
    other: 'Other',
};

// UNIQUE COLORS for each category - vibrant and distinct
const CATEGORY_COLORS = {
    theft: '#D4A853',           // Gold/Amber
    harassment: '#EF4444',       // Red
    vandalism: '#8B5CF6',        // Purple
    suspiciousActivity: '#3B9B8C', // Teal
    fire_hazard: '#F59E0B',       // Orange
    facility_issue: '#5B8DEE',    // Blue
    wildAnimal: '#10B981',        // Green
    trespassing: '#EC4899',       // Pink
    emergency_alert: '#DC2626',   // Dark Red
    other: '#6B7280',             // Gray
};

// COMPLETE LOCATION LABELS for display
export const locationLabels = {
  // Mahallahs (17 total)
  'Mahallahs': {
    Asiah: 'Mahallah Asiah',
    Aminah: 'Mahallah Aminah',
    Safiyyah: 'Mahallah Safiyyah',
    Maryam: 'Mahallah Maryam',
    Ruqayyah: 'Mahallah Ruqayyah',
    Ali: 'Mahallah Ali',
    Faruq: 'Mahallah Faruq',
    Bilal: 'Mahallah Bilal',
    Asma: 'Mahallah Asma',
    Hafsah: 'Mahallah Hafsah',
    Halimah: 'Mahallah Halimah',
    Siddiq: 'Mahallah Siddiq',
    Salahuddin: 'Mahallah Salahuddin',
    Uthman: 'Mahallah Uthman',
    Nusaibah: 'Mahallah Nusaibah',
    Zubair: 'Mahallah Zubair Al-Awwam',
    Sumayyah: 'Mahallah Sumayyah',
  },
  // Kulliyyahs (7 total)
  'Kulliyyahs': {
    KIRKHS: 'KIRKHS (AHAS KIRKHS)',
    KICT: 'KICT (ICT)',
    KOE: 'KOE (Engineering)',
    KAED: 'KAED (Architecture)',
    KENMS: 'KENMS (Economics)',
    AIKOL: 'AIKOL (Law)',
    KOED: 'KOED (Education)',
  },
  // Facilities (9 total)
  'Facilities': {
    Library: 'Dar al-Hikmah Library',
    FemaleSportsComplex: 'Female Sports Complex',
    Stadium: 'Saidina Hamzah Stadium',
    ArcheryRange: 'IIUM Archery Range',
    FootballTurf: 'UIA Football Turf',
    CricketGround: 'IIUM Cricket Ground',
    RugbyField: 'IIUM Rugby Field',
    PadangKawad: 'Padang Kawad UIAM',
    Educare: 'IIUM Educare',
  },
};

// COMPLETE LOCATION COLORS for all location types
const LOCATION_COLORS = {
  // Mahallah Colors (17 colors)
  'Asiah': '#3B9B8C',
  'Aminah': '#D4A853',
  'Safiyyah': '#8B5CF6',
  'Maryam': '#EF4444',
  'Ruqayyah': '#10B981',
  'Ali': '#F59E0B',
  'Faruq': '#5B8DEE',
  'Bilal': '#6B7280',
  'Asma': '#EC4899',
  'Hafsah': '#14B8A6',
  'Halimah': '#F97316',
  'Siddiq': '#6366F1',
  'Salahuddin': '#D946EF',
  'Uthman': '#F43F5E',
  'Nusaibah': '#0EA5E9',
  'Zubair': '#A855F7',
  'Sumayyah': '#22C55E',

  // Kulliyyah Colors
  'KIRKHS': '#EAB308',
  'KICT': '#06B6D4',
  'KOE': '#DC2626',
  'KAED': '#84CC16',
  'KENMS': '#F97316',
  'AIKOL': '#8B5CF6',
  'KOED': '#EC4899',

  // Facility Colors
  'Library': '#3B82F6',
  'FemaleSportsComplex': '#F43F5E',
  'Stadium': '#F59E0B',
  'ArcheryRange': '#10B981',
  'FootballTurf': '#14B8A6',
  'CricketGround': '#8B5CF6',
  'RugbyField': '#D946EF',
  'PadangKawad': '#6B7280',
  'Educare': '#F97316',
};

// Fallback colors array for any new locations
const FALLBACK_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F8C471', '#A3E4D7', '#F1948A', '#D7BDE2', '#FAD7A0'
];

const Statistics = () => {
  const {
    statistics: initialStatistics = {},
    weeklyData = [],
    monthlyData = [],
    mahallahData = [], // This can now include all location types
    filteredCategories = [],
    filteredMahallahData = [],
    averageResponseRateByMonth = []
  } = usePage().props;

  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [statistics, setStatistics] = useState(initialStatistics);
  const [weeklyChartData, setWeeklyChartData] = useState(weeklyData);
  const [monthlyTrendData, setMonthlyTrendData] = useState(monthlyData);

  // Transform category data to use proper display names and unique colors
  const transformedCategories = useMemo(() => {
    if (!filteredCategories || filteredCategories.length === 0) return [];

    return filteredCategories.map(cat => ({
      ...cat,
      name: categoryLabels[cat.name] || cat.name,
      color: CATEGORY_COLORS[cat.name] || `#${Math.floor(Math.random()*16777215).toString(16)}`
    }));
  }, [filteredCategories]);

  // Transform ALL location data (Mahallahs, Kulliyyahs, Facilities)
  const transformedLocationsData = useMemo(() => {
    if (!filteredMahallahData || filteredMahallahData.length === 0) return [];

    return filteredMahallahData.map((item, index) => {
      const locationKey = item.name || item.mahallah || 'Unknown';

      // Get color from LOCATION_COLORS or use fallback
      let color = LOCATION_COLORS[locationKey];

      // If not found, try to match by partial name or use fallback
      if (!color) {
        // Try to find by matching against locationLabels keys
        for (const group of Object.values(locationLabels)) {
          for (const [key, label] of Object.entries(group)) {
            if (label === locationKey || key === locationKey) {
              color = LOCATION_COLORS[key];
              break;
            }
          }
          if (color) break;
        }
      }

      return {
        ...item,
        name: locationLabels.Mahallahs[locationKey] ||
              locationLabels.Kulliyyahs[locationKey] ||
              locationLabels.Facilities[locationKey] ||
              locationKey,
        color: color || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
        type: item.type || 'Mahallah' // You can add type detection if needed
      };
    });
  }, [filteredMahallahData]);

  const [categoryDistribution, setCategoryDistribution] = useState(transformedCategories);
  const [incidentsByLocation, setIncidentsByLocation] = useState(transformedLocationsData);
  const [responseRateByMonth, setResponseRateByMonth] = useState(averageResponseRateByMonth || []);

  // Update when props change
  useEffect(() => {
    setCategoryDistribution(transformedCategories);
  }, [transformedCategories]);

  useEffect(() => {
    setIncidentsByLocation(transformedLocationsData);
  }, [transformedLocationsData]);

  useEffect(() => {
    setResponseRateByMonth(averageResponseRateByMonth || []);
  }, [averageResponseRateByMonth]);

  const getDateRange = (filter) => {
    const today = new Date();
    let dateFrom = '';
    let dateTo = '';

    if (filter === 'today') {
      dateFrom = today.toISOString().split('T')[0];
      dateTo = today.toISOString().split('T')[0];
    } else if (filter === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
      dateFrom = startOfWeek.toISOString().split('T')[0];
      dateTo = endOfWeek.toISOString().split('T')[0];
    } else if (filter === 'month') {
      dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      dateTo = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (filter === 'custom') {
      dateFrom = customDateFrom;
      dateTo = customDateTo;
    }

    return { dateFrom, dateTo };
  };

  const applyFilters = (filter = timeFilter) => {
    setIsLoading(true);
    const { dateFrom, dateTo } = getDateRange(filter);

    router.get(
      '/Statistics',
      {
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      },
      {
        preserveState: true,
        replace: true,
        onSuccess: (page) => {
          setStatistics(page.props.statistics || initialStatistics);
          setIsLoading(false);
        },
        onError: (error) => {
          console.error('Filter error:', error);
          setIsLoading(false);
        },
      }
    );
    setShowDateDropdown(false);
  };

  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
    if (filter !== 'custom') {
      applyFilters(filter);
    }
  };

  const applyCustomDateRange = () => {
    if (customDateFrom && customDateTo) {
      setTimeFilter('custom');
      applyFilters('custom');
    }
  };

  const clearFilters = () => {
    setTimeFilter('all');
    setCustomDateFrom('');
    setCustomDateTo('');
    setIsLoading(true);
    router.get(
      '/Statistics',
      {},
      {
        preserveState: true,
        replace: true,
        onSuccess: (page) => {
          setStatistics(page.props.statistics || initialStatistics);
          setIsLoading(false);
        },
        onError: () => setIsLoading(false),
      }
    );
    setShowDateDropdown(false);
  };

  const displayCategoryDistribution = categoryDistribution.length > 0 ? categoryDistribution : [];
  const displayLocationsData = incidentsByLocation.length > 0 ? incidentsByLocation : [];

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'custom': return customDateFrom && customDateTo ? `${customDateFrom} - ${customDateTo}` : 'Custom Range';
      default: return 'All Time';
    }
  };

  const stats = {
    totalReports: statistics.totalIncidents || 0,
    resolvedReports: statistics.resolvedIncidents || 0,
    pendingReports: statistics.pendingIncidents || 0,
    inProgressReports: statistics.inProgressIncidents || 0,
    nfaReports: statistics.nfaIncidents || 0,
    avgResponseTime: statistics.avgResponseTime || 'N/A',
    resolutionRate: statistics.resolutionRate || 0,
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleExportCSV = () => {
    try {
      const exportData = [];

      exportData.push(['=== SUMMARY STATISTICS ===']);
      exportData.push(['Metric', 'Value']);
      exportData.push(['Total Reports', stats.totalReports]);
      exportData.push(['Resolved Reports', stats.resolvedReports]);
      exportData.push(['Pending Reports', stats.pendingReports]);
      exportData.push(['In Progress Reports', stats.inProgressReports]);
      exportData.push(['NFA Reports', stats.nfaReports]);
      exportData.push(['Resolution Rate', `${stats.resolutionRate}%`]);
      exportData.push(['Average Response Time', stats.avgResponseTime]);
      exportData.push([]);

      exportData.push(['=== CATEGORY DISTRIBUTION ===']);
      exportData.push(['Category', 'Percentage (%)', 'Count']);
      displayCategoryDistribution.forEach(cat => {
        exportData.push([cat.name, cat.value, cat.count || 0]);
      });
      exportData.push([]);

      exportData.push(['=== WEEKLY REPORTS VS RESOLVED ===']);
      exportData.push(['Day', 'Reports', 'Resolved']);
      weeklyChartData.forEach(week => {
        exportData.push([week.day, week.reports, week.resolved]);
      });
      exportData.push([]);

      exportData.push(['=== MONTHLY INCIDENT TREND ===']);
      exportData.push(['Month', 'Incidents']);
      monthlyTrendData.forEach(month => {
        exportData.push([month.month, month.incidents]);
      });
      exportData.push([]);

      exportData.push(['=== RESPONSE RATE BY MONTH ===']);
      exportData.push(['Month', 'Response Rate (%)']);
      responseRateByMonth.forEach(month => {
        exportData.push([month.month, month.responseRate]);
      });
      exportData.push([]);

      exportData.push(['=== INCIDENTS BY LOCATION ===']);
      exportData.push(['Location', 'Incident Count']);
      displayLocationsData.forEach(loc => {
        exportData.push([loc.name, loc.count]);
      });

      const csvContent = exportData.map(row =>
        row.map(cell => {
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      ).join('\n');

      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `statistics_report_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Statistics exported successfully!', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Failed to export statistics', 'error');
    }
  };

  // Custom tooltip formatter for category pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
          <p className="font-medium text-gray-900 dark:text-white" style={{ color: payload[0].payload.fill || payload[0].payload.color }}>
            {payload[0].name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Percentage: <span className="font-bold">{payload[0].value}%</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Count: <span className="font-bold">{payload[0].payload.count || 0}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout title="Statistics" subtitle="Data insights for OSeM management meetings">

      {isLoading && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4A853]" />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <SimpleDropdown
            isOpen={showDateDropdown}
            onClose={() => setShowDateDropdown(false)}
            trigger={
            <Button
                variant={timeFilter !== 'all' ? "default" : "outline"}
                className={`gap-2 rounded-xl ${timeFilter !== 'all' ? 'bg-[#D4A853] hover:bg-[#C49A48] text-white' : ''} dark:bg-slate-800`}
                onClick={() => setShowDateDropdown(!showDateDropdown)}
            >
                <Calendar className="w-4 h-4" />
                {getTimeFilterLabel()}
                {timeFilter !== 'all' && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    1
                </span>
                )}
                <ChevronDown className="w-4 h-4" />
            </Button>
            }
        >
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl min-w-[260px] shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="space-y-1">
                <button
                onClick={() => handleTimeFilterChange('today')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    timeFilter === 'today'
                    ? 'bg-[#D4A853] text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
                >
                Today
                </button>
                <button
                onClick={() => handleTimeFilterChange('week')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    timeFilter === 'week'
                    ? 'bg-[#D4A853] text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
                >
                This Week
                </button>
                <button
                onClick={() => handleTimeFilterChange('month')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    timeFilter === 'month'
                    ? 'bg-[#D4A853] text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
                >
                This Month
                </button>
                <button
                onClick={() => handleTimeFilterChange('all')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    timeFilter === 'all'
                    ? 'bg-[#D4A853] text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
                >
                All Time
                </button>

                <div className="border-t border-gray-200 dark:border-slate-700 my-2 pt-2">
                <p className="text-xs text-muted-foreground dark:text-gray-400 mb-2">Custom Range</p>
                <div className="space-y-2">
                    <Input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 rounded-lg text-sm h-9 text-gray-900 dark:text-white"
                    />
                    <Input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 rounded-lg text-sm h-9 text-gray-900 dark:text-white"
                    />
                    <div className="flex gap-2 pt-1">
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-lg h-8 text-xs border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                        onClick={() => {
                        setCustomDateFrom('');
                        setCustomDateTo('');
                        setTimeFilter('all');
                        applyFilters('all');
                        }}
                    >
                        Clear
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1 bg-[#D4A853] hover:bg-[#C49A48] rounded-lg h-8 text-xs text-white"
                        onClick={applyCustomDateRange}
                        disabled={!customDateFrom || !customDateTo}
                    >
                        Apply
                    </Button>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </SimpleDropdown>

        <Button
          className="gap-2 bg-[#D4A853] hover:bg-[#C49A48] rounded-xl shadow-sm dark:text-white"
          onClick={handleExportCSV}
        >
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white dark:bg-slate-800 border-l-4 border-l-[#32B6AD] rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground dark:text-gray-400 font-medium uppercase tracking-wide">Total Reports</p>
              <BarChart3 className="w-4 h-4 text-[#D4A853]" />
            </div>
            <p className="text-3xl font-bold text-[#32B6AD] dark:text-[#32B6AD]">{stats.totalReports}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{timeFilter !== 'all' ? 'Filtered by date' : 'All time'}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#CFE7C4]/60 dark:bg-green-500/20 border-l-4 border-l-green-500 rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground dark:text-gray-400 font-medium uppercase tracking-wide">Resolved</p>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.resolvedReports}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{stats.totalReports > 0 ? Math.round((stats.resolvedReports / stats.totalReports) * 100) : 0}% of total</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground dark:text-gray-400 font-medium uppercase tracking-wide">Avg Response</p>
            </div>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.avgResponseTime}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400">
              <TrendingDown className="w-3 h-3" />
              <span>vs previous period</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground dark:text-gray-400 font-medium uppercase tracking-wide">Resolution Rate</p>
              <PieChart className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.resolutionRate}%</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{stats.resolvedReports} of {stats.totalReports}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Weekly Reports vs Resolved</h3>
            <p className="text-xs text-muted-foreground dark:text-gray-400 mb-4">Comparison of incoming reports and resolutions (Overall Trend)</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyChartData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-xs dark:text-gray-400" />
                <YAxis axisLine={false} tickLine={false} className="text-xs dark:text-gray-400" />
                <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
                <Legend wrapperStyle={{ color: '#6b7280' }} />
                <Bar dataKey="reports" fill="#3B9B8C" radius={[4, 4, 0, 0]} name="Reports" />
                <Bar dataKey="resolved" fill="#D4A853" radius={[4, 4, 0, 0]} name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Incident Categories</h3>
            <p className="text-xs text-muted-foreground dark:text-gray-400 mb-4">Distribution by incident type {timeFilter !== 'all' ? '(Filtered by selected date range)' : '(All time)'}</p>
            {displayCategoryDistribution.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <RechartsPie>
                    <Pie
                      data={displayCategoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {displayCategoryDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {displayCategoryDistribution.map((cat, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="flex-1 text-gray-600 dark:text-gray-300">{cat.name}</span>
                      <span className="font-medium dark:text-white">{cat.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {timeFilter !== 'all' ? 'No incidents found for the selected date range' : 'No incident data available'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Monthly Incident Trend</h3>
            <p className="text-xs text-muted-foreground dark:text-gray-400 mb-4">Incident volume over time (Overall Trend)</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyTrendData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs dark:text-gray-400" />
                <YAxis axisLine={false} tickLine={false} className="text-xs dark:text-gray-400" />
                <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
                <Line
                  type="monotone"
                  dataKey="incidents"
                  stroke="#3B9B8C"
                  strokeWidth={3}
                  dot={{ fill: '#3B9B8C', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#3B9B8C' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Average Response Rate by Month</h3>
            <p className="text-xs text-muted-foreground dark:text-gray-400 mb-4">Percentage of resolved cases per month</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={responseRateByMonth}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs dark:text-gray-400" />
                <YAxis axisLine={false} tickLine={false} className="text-xs dark:text-gray-400" domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: '#fff', border: '1px solid #e5e7eb' }} formatter={(value) => [`${value}%`, 'Response Rate']} />
                <Line
                  type="monotone"
                  dataKey="responseRate"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#F59E0B' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Incidents by Location - Updated to show all locations */}
      <Card className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-1">Incidents by Location</h3>
          <p className="text-xs text-muted-foreground dark:text-gray-400 mb-5">Comparative incident volume across all campus locations {timeFilter !== 'all' ? '(Filtered by selected date range)' : '(All time)'}</p>
          {displayLocationsData.length > 0 ? (
            <div className="space-y-4">
              {displayLocationsData.map((loc, i) => {
                const maxCount = Math.max(...displayLocationsData.map(item => item.count), 1);
                const widthPercent = (loc.count / maxCount) * 100;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-48 text-sm font-medium text-gray-700 dark:text-gray-300 truncate" title={loc.name}>
                      {loc.name}
                    </div>
                    <div className="flex-1 h-8 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${widthPercent}%`, backgroundColor: loc.color }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                    <span className="text-sm font-bold w-10 text-right" style={{ color: loc.color }}>{loc.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {timeFilter !== 'all' ? 'No incidents found for the selected date range' : 'No incident data available'}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Statistics;
