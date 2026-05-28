import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertTriangle, Clock, CheckCircle, Radio, Send, Calendar, MapPin, ChevronDown,
  FileText, User, Phone, Loader2, Mail, Undo2, X, Search, Filter, Shield, Trash2,
  ChevronLeft, ChevronRight, TrendingUp, Activity, Zap, Globe, Building2, School,
  Home, Library, HelpCircle, Sparkles, Bell, BellRing
} from 'lucide-react';
import { DispatchOfficerModal } from '@/Components/dashboard/DispatchOfficerModal';
import { AddEmergencyReport } from '@/Components/dashboard/AddEmergencyReport';
import { DecisionModal } from '@/Components/dashboard/DecisionModal';
import { ConfirmationModal } from '@/Components/dashboard/ConfirmationModal';
import axios from 'axios';

// ============================================================
// CONSTANTS & HELPERS
// ============================================================

const locationLabels = {
  'Mahallahs': {
    'Asiah': 'Mahallah Asiah',
    'Aminah': 'Mahallah Aminah',
    'Safiyyah': 'Mahallah Safiyyah',
    'Maryam': 'Mahallah Maryam',
    'Ruqayyah': 'Mahallah Ruqayyah',
    'Ali': 'Mahallah Ali',
    'Faruq': 'Mahallah Faruq',
    'Bilal': 'Mahallah Bilal',
    'Asma': 'Mahallah Asma',
    'Hafsah': 'Mahallah Hafsah',
    'Halimah': 'Mahallah Halimah',
    'Siddiq': 'Mahallah Siddiq',
    'Salahuddin': 'Mahallah Salahuddin',
    'Uthman': 'Mahallah Uthman',
    'Nusaibah': 'Mahallah Nusaibah',
    'Zubair Al-Awwam': 'Mahallah Zubair',
    'Sumayyah': 'Mahallah Sumayyah',
  },
  'Kulliyyahs': {
    'KIRKHS': 'KIRKHS (AHAS KIRKHS)',
    'KICT': 'KICT (ICT)',
    'KOE': 'KOE (Engineering)',
    'KAED': 'KAED (Architecture)',
    'KENMS': 'KENMS (Economics)',
    'AIKOL': 'AIKOL (Law)',
    'KOED': 'KOED (Education)',
  },
  'Facilities': {
    'Dar al-Hikmah Library': 'Dar al-Hikmah Library',
    'Female Sports Complex': 'Female Sports Complex',
    'Saidina Hamzah Stadium': 'Saidina Hamzah Stadium',
    'IIUM Archery Range': 'IIUM Archery Range',
    'UIA Football Turf': 'UIA Football Turf',
    'IIUM Cricket Ground': 'IIUM Cricket Ground',
    'IIUM Rugby Field': 'IIUM Rugby Field',
    'Padang Kawad UIAM': 'Padang Kawad UIAM',
    'IIUM Educare': 'IIUM Educare',
    'Sultan Haji Ahmad Shah Mosque': 'Sultan Haji Ahmad Shah Mosque',
  },
};

const formatLocationName = (locationKey) => {
  if (!locationKey) return 'Unknown Location';
  for (const group of Object.values(locationLabels)) {
    if (group[locationKey]) return group[locationKey];
  }
  return locationKey;
};

const statusConfig = {
  active: { label: 'Active', color: 'red', icon: AlertTriangle, bgClass: 'bg-red-50 dark:bg-red-950/30', borderClass: 'border-red-500' },
  responding: { label: 'Responding', color: 'amber', icon: Radio, bgClass: 'bg-amber-50 dark:bg-amber-950/30', borderClass: 'border-amber-500' },
  resolved: { label: 'Resolved', color: 'green', icon: CheckCircle, bgClass: 'bg-green-50 dark:bg-green-950/30', borderClass: 'border-green-500' },
};

const showToast = (message, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm animate-in slide-in-from-bottom-2 backdrop-blur-sm ${
    type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600' :
    type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600' :
    'bg-gradient-to-r from-blue-500 to-blue-600'
  }`;
  toast.innerHTML = `<div class="flex items-center gap-2">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}<span>${message}</span></div>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
};

// ============================================================
// UI COMPONENTS
// ============================================================

const SimpleDropdown = ({ trigger, children, isOpen, onClose, align = 'left' }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={dropdownRef}>
      {trigger}
      {isOpen && (
        <div className={`absolute top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 min-w-[320px] max-h-[480px] overflow-y-auto ${align === 'right' ? 'right-0' : 'left-0'} dark:bg-slate-800 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-200`}>
          <div className="p-1">{children}</div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, trend, color }) => {
  const colorClasses = {
    red: { bg: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/30', iconBg: 'bg-red-500', iconColor: 'text-white', valueColor: 'text-red-600 dark:text-red-400' },
    amber: { bg: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/30', iconBg: 'bg-amber-500', iconColor: 'text-white', valueColor: 'text-amber-600 dark:text-amber-400' },
    green: { bg: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/30', iconBg: 'bg-green-500', iconColor: 'text-white', valueColor: 'text-green-600 dark:text-green-400' },
    blue: { bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30', iconBg: 'bg-blue-500', iconColor: 'text-white', valueColor: 'text-blue-600 dark:text-blue-400' },
  };

  const classes = colorClasses[color] || colorClasses.blue;

  return (
    <Card className={`${classes.bg} rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border-0 overflow-hidden group`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
            <p className={`text-3xl font-bold ${classes.valueColor}`}>{value}</p>
            {trend && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{trend}</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl ${classes.iconBg} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${classes.iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.active;
  const Icon = config.icon;
  return (
    <Badge className={`${config.bgClass} text-${config.color}-700 dark:text-${config.color}-300 border-0 gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};

const AlertCard = ({ alert, onClick, onAction, isDispatching, isReverting, getTimeAgo, formatDate, onDelete }) => {
  const config = statusConfig[alert.status] || statusConfig.active;
  const StatusIcon = config.icon;

  const displayLocation = alert.determined_location
    ? formatLocationName(alert.determined_location)
    : (alert.address || alert.location?.mahallah || alert.location || 'Unknown Location');

  const getActionButton = () => {
    if (alert.status === 'active') {
      return (
        <Button
          size="sm"
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl gap-1.5 px-4 h-9 shadow-sm hover:shadow transition-all"
          onClick={(e) => { e.stopPropagation(); onAction('dispatch', alert); }}
          disabled={isDispatching}
        >
          {isDispatching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span className="text-xs font-medium">Dispatch</span>
        </Button>
      );
    } else if (alert.status === 'responding') {
      return (
        <Button
          size="sm"
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl gap-1.5 px-4 h-9 shadow-sm hover:shadow transition-all"
          onClick={(e) => { e.stopPropagation(); onAction('resolve', alert); }}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Resolve</span>
        </Button>
      );
    } else if (alert.status === 'resolved') {
      return (
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl px-3 h-9 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <Undo2 className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl min-w-[180px] p-1 dark:bg-slate-800 dark:border-slate-700">
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onAction('revertToResponding', alert); }}
                className="gap-2 text-amber-600 focus:text-amber-600 focus:bg-amber-50 cursor-pointer rounded-lg dark:text-amber-400 dark:focus:bg-amber-950/30"
                disabled={isReverting}
              >
                <Undo2 className="w-3.5 h-3.5" /><span>Revert to Responding</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onAction('revertToActive', alert); }}
                className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer rounded-lg dark:text-red-400 dark:focus:bg-red-950/30"
                disabled={isReverting}
              >
                <Undo2 className="w-3.5 h-3.5" /><span>Revert to Active</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            className="bg-transparent hover:bg-red-50 rounded-xl px-3 h-9 dark:hover:bg-red-950/30 transition-colors"
            onClick={(e) => { e.stopPropagation(); onDelete(alert); }}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>

          <Button
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl gap-1.5 px-4 h-9 shadow-sm hover:shadow transition-all"
            onClick={(e) => { e.stopPropagation(); onAction('createReport', alert); }}
          >
            <FileText className="w-4 h-4" />
            <span className="text-xs font-medium">Report</span>
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      className={`border-l-4 ${config.borderClass} rounded-xl cursor-pointer hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-800/90 hover:scale-[1.01] group`}
      onClick={() => onClick(alert)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-xl ${config.bgClass} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
              <StatusIcon className={`w-5 h-5 text-${config.color}-500 dark:text-${config.color}-400`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-semibold text-sm dark:text-gray-200">Emergency Alert</span>
                <StatusBadge status={alert.status} />
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{getTimeAgo(alert.triggeredAt)}</span>
                </div>
              </div>
              {alert.student && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1 dark:text-gray-400">
                  <User className="w-3 h-3" />
                  <span className="font-medium">{alert.student.name}</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-xs">{alert.student.matrixNumber}</span>
                </p>
              )}
              <p className="text-xs text-gray-500 flex items-center gap-1.5 dark:text-gray-400">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{displayLocation}</span>
              </p>
            </div>
          </div>
          {getActionButton()}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================
// MAIN ALERTS COMPONENT
// ============================================================

const Alerts = () => {
  // State
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedAlertForDispatch, setSelectedAlertForDispatch] = useState(null);
  const [globalStats, setGlobalStats] = useState({ active: 0, responding: 0, resolved: 0, total: 0 });

  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showAddReportModal, setShowAddReportModal] = useState(false);

  const [alertToResolve, setAlertToResolve] = useState(null);
  const [alertForReport, setAlertForReport] = useState(null);

  const [isDispatching, setIsDispatching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [filters, setFilters] = useState({ status: [], locations: [] });

  const [pagination, setPagination] = useState({
    current_page: 1, per_page: 10, total: 0,
    last_page: 1, from: null, to: null,
  });

  const searchTimeoutRef = useRef(null);

  const statusOptions = [
    { value: 'active', label: 'Active', icon: AlertTriangle, color: 'red' },
    { value: 'responding', label: 'Responding', icon: Radio, color: 'amber' },
    { value: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'green' },
  ];

  // Memoized helpers
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-MY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  }, []);

  const getTimeAgo = useCallback((dateString) => {
    const diffMs = new Date() - new Date(dateString);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffHours / 24)} days ago`;
  }, []);

  const getFilterCount = useMemo(() => filters.status.length + filters.locations.length, [filters]);

  const getDateFilterLabel = useCallback(() => {
    if (datePreset === 'today') return 'Today';
    if (datePreset === 'week') return 'This Week';
    if (datePreset === 'month') return 'This Month';
    if (customDateFrom && customDateTo) return `${customDateFrom} - ${customDateTo}`;
    if (customDateFrom) return `From ${customDateFrom}`;
    if (customDateTo) return `Until ${customDateTo}`;
    return 'Date Range';
  }, [datePreset, customDateFrom, customDateTo]);

  const hasActiveFilters = getFilterCount > 0 || datePreset !== 'all' || customDateFrom || customDateTo || searchQuery;

  const getPageNumbers = useCallback(() => {
    const { last_page: totalPages, current_page: currentPage } = pagination;
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  }, [pagination]);

  const buildQueryParams = useCallback((page = 1, perPage = pagination.per_page) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('per_page', perPage);
    if (filters.status.length > 0) params.append('status', filters.status.join(','));
    if (filters.locations.length > 0) params.append('locations', filters.locations.join(','));
    return params;
  }, [filters, pagination.per_page]);

  // API calls
  const fetchGlobalStats = useCallback(async () => {
    try {
      const response = await axios.get('/api/emergencies/counts');
      setGlobalStats({
        active: response.data.active || 0,
        responding: response.data.responding || 0,
        resolved: response.data.resolved || 0,
        total: (response.data.active || 0) + (response.data.responding || 0) + (response.data.resolved || 0),
      });
    } catch (error) {
      console.error('Failed to fetch global stats:', error);
    }
  }, []);

  const fetchEmergencies = useCallback(async (page = 1, perPage = pagination.per_page) => {
    setLoading(true);
    try {
      const params = buildQueryParams(page, perPage);
      const response = await axios.get(`/api/emergencies?${params.toString()}`);
      const data = response.data;
      setAlerts(data.data || []);
      setPagination(data.pagination);
      window.dispatchEvent(new CustomEvent('emergency-updated'));
    } catch (error) {
      console.error('Failed to fetch emergencies:', error);
      showToast('Failed to load emergencies', 'error');
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, pagination.per_page]);

  const handleDeleteEmergency = useCallback(async (alert) => {
    const alertId = alert._id || alert.id;
    if (confirm('Are you sure you want to delete this emergency record? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        const response = await axios.delete(`/api/emergencies/${alertId}`, {
          headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content },
        });
        if (response.data.success) {
          showToast('Emergency record deleted successfully', 'success');
          setSelectedAlert(null);
          await fetchEmergencies(pagination.current_page, pagination.per_page);
          await fetchGlobalStats();
        }
      } catch (error) {
        showToast(error.response?.data?.error || 'Failed to delete emergency', 'error');
      } finally {
        setIsDeleting(false);
      }
    }
  }, [fetchEmergencies, fetchGlobalStats, pagination.current_page, pagination.per_page]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      fetchEmergencies(newPage, pagination.per_page);
    }
  }, [fetchEmergencies, pagination.last_page, pagination.per_page]);

  const handlePerPageChange = useCallback((newPerPage) => {
    setPagination(prev => ({ ...prev, per_page: newPerPage }));
    fetchEmergencies(1, newPerPage);
  }, [fetchEmergencies]);

  const toggleFilter = useCallback((filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(v => v !== value)
        : [...prev[filterType], value],
    }));
    setPagination(prev => ({ ...prev, current_page: 1 }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setDatePreset('all');
    setCustomDateFrom('');
    setCustomDateTo('');
    setFilters({ status: [], locations: [] });
    setPagination(prev => ({ ...prev, current_page: 1 }));
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchEmergencies(1, pagination.per_page);
    }, 300);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [filters.status, filters.locations, pagination.per_page, fetchEmergencies]);

  // Client-side filtering
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const studentName = alert.student?.name?.toLowerCase() || '';
        const matrixNumber = alert.student?.matrixNumber?.toLowerCase() || '';
        const location = alert.address?.toLowerCase() || alert.location?.mahallah?.toLowerCase() || '';
        const determinedLocation = alert.determined_location?.toLowerCase() || '';
        if (!studentName.includes(q) && !matrixNumber.includes(q) && !location.includes(q) && !determinedLocation.includes(q)) return false;
      }
      if (filters.status.length > 0 && !filters.status.includes(alert.status)) return false;
      if (filters.locations.length > 0 && !filters.locations.includes(alert.determined_location)) return false;

      const alertDate = new Date(alert.triggeredAt);
      alertDate.setHours(0, 0, 0, 0);
      if (datePreset === 'today') {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (alertDate.getTime() !== today.getTime()) return false;
      } else if (datePreset === 'week') {
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); weekAgo.setHours(0, 0, 0, 0);
        if (alertDate < weekAgo) return false;
      } else if (datePreset === 'month') {
        const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1); monthAgo.setHours(0, 0, 0, 0);
        if (alertDate < monthAgo) return false;
      } else if (customDateFrom || customDateTo) {
        if (customDateFrom) { const from = new Date(customDateFrom); from.setHours(0,0,0,0); if (alertDate < from) return false; }
        if (customDateTo) { const to = new Date(customDateTo); to.setHours(23,59,59,999); if (alertDate > to) return false; }
      }
      return true;
    });
  }, [alerts, searchQuery, filters, datePreset, customDateFrom, customDateTo]);

  // Action handlers
  const updateLocalAlertStatus = useCallback((alertId, newStatus) => {
    setAlerts(prev => prev.map(a => (a._id === alertId || a.id === alertId) ? { ...a, status: newStatus } : a));
    if (selectedAlert && (selectedAlert._id === alertId || selectedAlert.id === alertId)) {
      setSelectedAlert({ ...selectedAlert, status: newStatus });
    }
  }, [selectedAlert]);

  const handleRevertStatus = useCallback(async (alert, newStatus) => {
    const alertId = alert._id || alert.id;
    setIsReverting(true);
    updateLocalAlertStatus(alertId, newStatus);
    try {
      await axios.put(`/api/emergencies/${alertId}/revert`, { status: newStatus });
      await fetchEmergencies(pagination.current_page, pagination.per_page);
      await fetchGlobalStats();
      setSelectedAlert(null);
    } catch (error) {
      console.error('Failed to revert status:', error);
      await fetchEmergencies(pagination.current_page, pagination.per_page);
    } finally {
      setIsReverting(false);
    }
  }, [fetchEmergencies, fetchGlobalStats, pagination.current_page, pagination.per_page, updateLocalAlertStatus]);

  const handleDispatchOfficer = useCallback(async (dispatchData) => {
    if (!selectedAlertForDispatch) return;
    const alertId = selectedAlertForDispatch._id || selectedAlertForDispatch.id;
    setIsDispatching(true);
    try {
      const response = await axios.put(`/api/emergencies/${alertId}/dispatch`, dispatchData);
      if (response.data.success) {
        showToast(`Officer ${dispatchData.officerName} has been dispatched successfully!`, 'success');
        await fetchEmergencies(pagination.current_page, pagination.per_page);
        await fetchGlobalStats();
        setShowDispatchModal(false);
        setSelectedAlertForDispatch(null);
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to dispatch officer', 'error');
    } finally {
      setIsDispatching(false);
    }
  }, [selectedAlertForDispatch, fetchEmergencies, fetchGlobalStats, pagination.current_page, pagination.per_page]);

  const handleResolveClick = useCallback((alert) => {
    setAlertToResolve(alert);
    setShowConfirmationModal(true);
  }, []);

  const handleConfirmResolve = useCallback(async () => {
    if (!alertToResolve) return;
    const alertId = alertToResolve._id || alertToResolve.id;
    setIsResolving(true);
    try {
      await axios.put(`/api/emergencies/${alertId}/resolve`);
      await fetchEmergencies(pagination.current_page, pagination.per_page);
      await fetchGlobalStats();
      setShowConfirmationModal(false);
      setAlertForReport(alertToResolve);
      setAlertToResolve(null);
      setShowDecisionModal(true);
    } catch (error) {
      showToast('Failed to mark as resolved', 'error');
    } finally {
      setIsResolving(false);
    }
  }, [alertToResolve, fetchEmergencies, fetchGlobalStats, pagination.current_page, pagination.per_page]);

  const handleDecisionYes = useCallback(() => {
    setShowDecisionModal(false);
    setShowAddReportModal(true);
  }, []);

  const handleDecisionNo = useCallback(() => {
    setShowDecisionModal(false);
    setAlertForReport(null);
    showToast('Report creation skipped', 'success');
  }, []);

  const handleSaveReport = useCallback(async (reportData) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post('/Reports', reportData, {
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content },
      });
      if (response.data.success || response.status === 200 || response.status === 201) {
        showToast('Report created successfully!', 'success');
        setShowAddReportModal(false);
        setAlertForReport(null);
      }
    } catch (error) {
      showToast(error.response?.data?.message || error.response?.data?.error || 'Failed to create report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleAction = useCallback(async (action, alert) => {
    switch (action) {
      case 'dispatch': setSelectedAlertForDispatch(alert); setShowDispatchModal(true); break;
      case 'resolve': handleResolveClick(alert); setSelectedAlert(null); break;
      case 'createReport': setAlertForReport(alert); setShowAddReportModal(true); break;
      case 'revertToResponding': await handleRevertStatus(alert, 'responding'); break;
      case 'revertToActive': await handleRevertStatus(alert, 'active'); break;
    }
  }, [handleResolveClick, handleRevertStatus]);

  useEffect(() => {
    fetchEmergencies();
    fetchGlobalStats();
    const interval = setInterval(() => {
      fetchEmergencies(pagination.current_page, pagination.per_page);
      fetchGlobalStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchEmergencies, fetchGlobalStats, pagination.current_page, pagination.per_page]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <DashboardLayout title="Emergency Alerts" subtitle="Monitor and respond to emergency situations">
      {/* Animated Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center shadow-lg">
            <BellRing className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Emergency Response Center</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Real-time monitoring and dispatch management</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard icon={AlertTriangle} label="Active Emergencies" value={globalStats.active} color="red" trend="Requires immediate attention" />
        <StatCard icon={Radio} label="In Progress" value={globalStats.responding} color="amber" trend="Officers en route" />
        <StatCard icon={CheckCircle} label="Resolved" value={globalStats.resolved} color="green" trend="Successfully handled" />
        <StatCard icon={Activity} label="Total Incidents" value={globalStats.total} color="blue" trend="Last 30 days" />
      </div>

      {/* Main Content Card */}
      <Card className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-xl border-0 overflow-hidden">
        <CardContent className="p-0">

          {/* Filter Bar - Sticky */}
          <div className="sticky top-0 z-10 bg-white dark:bg-slate-800/95 backdrop-blur-sm border-b border-gray-100 dark:border-slate-700 p-5">
            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search by name, matrix, or location..."
                  className="pl-10 bg-gray-50 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#D4A853]/20 focus:border-[#D4A853] dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filters Dropdown */}
              <SimpleDropdown
                isOpen={showFilterDropdown}
                onClose={() => setShowFilterDropdown(false)}
                align="left"
                trigger={
                  <Button
                    variant={getFilterCount > 0 ? 'default' : 'outline'}
                    className={`gap-2 rounded-xl relative ${
                      getFilterCount > 0
                        ? 'bg-gradient-to-r from-[#D4A853] to-[#C49A48] hover:from-[#C49A48] hover:to-[#B48A38] text-white shadow-md'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700'
                    }`}
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                    {getFilterCount > 0 && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                        {getFilterCount}
                      </span>
                    )}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                }
              >
                <div className="p-4 space-y-5">
                  {/* Status Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</Label>
                      {filters.status.length > 0 && (
                        <button onClick={() => setFilters(prev => ({ ...prev, status: [] }))} className="text-xs text-red-500 hover:text-red-600 font-medium">
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {statusOptions.map(option => {
                        const Icon = option.icon;
                        return (
                          <label key={option.value} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-colors dark:hover:bg-slate-700">
                            <input
                              type="checkbox"
                              checked={filters.status.includes(option.value)}
                              onChange={() => toggleFilter('status', option.value)}
                              className="rounded-md border-gray-300 text-[#D4A853] focus:ring-[#D4A853] dark:border-slate-600 dark:bg-slate-700"
                            />
                            <Icon className={`w-4 h-4 text-${option.color}-500`} />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-slate-700" />

                  {/* Locations Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Locations</Label>
                      {filters.locations.length > 0 && (
                        <button onClick={() => setFilters(prev => ({ ...prev, locations: [] }))} className="text-xs text-red-500 hover:text-red-600 font-medium">
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="space-y-4 max-h-56 overflow-y-auto pr-2">
                      {Object.entries(locationLabels).map(([groupName, locationsGroup]) => (
                        <div key={groupName}>
                          <div className="flex items-center gap-2 mb-2">
                            {groupName === 'Mahallahs' && <Home className="w-3 h-3 text-blue-500" />}
                            {groupName === 'Kulliyyahs' && <School className="w-3 h-3 text-green-500" />}
                            {groupName === 'Facilities' && <Building2 className="w-3 h-3 text-purple-500" />}
                            <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400">{groupName}</Label>
                          </div>
                          <div className="space-y-1.5 pl-2">
                            {Object.entries(locationsGroup).map(([key, label]) => (
                              <label key={key} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors dark:hover:bg-slate-700">
                                <input
                                  type="checkbox"
                                  checked={filters.locations.includes(key)}
                                  onChange={() => toggleFilter('locations', key)}
                                  className="rounded-md border-gray-300 text-[#D4A853] focus:ring-[#D4A853] dark:border-slate-600 dark:bg-slate-700"
                                />
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setFilters({ status: [], locations: [] }); setShowFilterDropdown(false); }}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              </SimpleDropdown>

              {/* Date Range Dropdown */}
              <SimpleDropdown
                isOpen={showDateDropdown}
                onClose={() => setShowDateDropdown(false)}
                align="right"
                trigger={
                  <Button
                    variant={(datePreset !== 'all' || customDateFrom || customDateTo) ? 'default' : 'outline'}
                    className={`gap-2 rounded-xl ${
                      (datePreset !== 'all' || customDateFrom || customDateTo)
                        ? 'bg-gradient-to-r from-[#D4A853] to-[#C49A48] hover:from-[#C49A48] hover:to-[#B48A38] text-white shadow-md'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700'
                    }`}
                    onClick={() => setShowDateDropdown(!showDateDropdown)}
                  >
                    <Calendar className="w-4 h-4" />
                    {getDateFilterLabel()}
                    {(datePreset !== 'all' || customDateFrom || customDateTo) && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-800">1</span>
                    )}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                }
              >
                <div className="p-4 min-w-[280px] space-y-4">
                  <div>
                    <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Quick Select</Label>
                    <div className="space-y-1">
                      {[
                        { value: 'today', label: 'Today', icon: Zap },
                        { value: 'week', label: 'This Week', icon: Calendar },
                        { value: 'month', label: 'This Month', icon: Calendar },
                        { value: 'all', label: 'All Time', icon: Globe },
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => {
                            const today = new Date();
                            if (value === 'today') {
                              const d = today.toISOString().split('T')[0];
                              setCustomDateFrom(d); setCustomDateTo(d);
                            } else if (value === 'week') {
                              const start = new Date(today); start.setDate(today.getDate() - today.getDay());
                              const end = new Date(today); end.setDate(today.getDate() + (6 - today.getDay()));
                              setCustomDateFrom(start.toISOString().split('T')[0]);
                              setCustomDateTo(end.toISOString().split('T')[0]);
                            } else if (value === 'month') {
                              const start = new Date(today.getFullYear(), today.getMonth(), 1);
                              const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                              setCustomDateFrom(start.toISOString().split('T')[0]);
                              setCustomDateTo(end.toISOString().split('T')[0]);
                            } else {
                              setCustomDateFrom(''); setCustomDateTo('');
                            }
                            setDatePreset(value);
                            setShowDateDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-3 ${
                            datePreset === value
                              ? 'bg-gradient-to-r from-[#D4A853]/10 to-[#C49A48]/10 text-[#D4A853] font-medium border border-[#D4A853]/30'
                              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-slate-700" />

                  <div>
                    <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Custom Range</Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block dark:text-gray-400">From</Label>
                        <Input
                          type="date"
                          value={customDateFrom}
                          onChange={(e) => { setCustomDateFrom(e.target.value); setDatePreset('custom'); }}
                          className="bg-gray-50 border-gray-200 rounded-xl text-sm h-10 text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block dark:text-gray-400">To</Label>
                        <Input
                          type="date"
                          value={customDateTo}
                          onChange={(e) => { setCustomDateTo(e.target.value); setDatePreset('custom'); }}
                          className="bg-gray-50 border-gray-200 rounded-xl text-sm h-10 text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button variant="outline" className="flex-1 rounded-xl border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300" onClick={() => { setCustomDateFrom(''); setCustomDateTo(''); setDatePreset('all'); setShowDateDropdown(false); }}>Clear</Button>
                        <Button className="flex-1 bg-gradient-to-r from-[#D4A853] to-[#C49A48] hover:from-[#C49A48] hover:to-[#B48A38] rounded-xl text-white shadow-md" onClick={() => setShowDateDropdown(false)}>Apply</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </SimpleDropdown>

              {hasActiveFilters && (
                <Button variant="ghost" className="gap-2 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30" onClick={clearAllFilters}>
                  <X className="w-4 h-4" />Clear All
                </Button>
              )}
            </div>

            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap gap-2">
                {filters.status.map(s => {
                  const config = statusConfig[s];
                  return (
                    <Badge key={s} className={`gap-1.5 px-3 py-1.5 ${config.bgClass} text-${config.color}-700 border-0 rounded-full text-xs`}>
                      <config.icon className="w-3 h-3" />
                      {config.label}
                      <X className="w-3 h-3 cursor-pointer hover:opacity-70 ml-1" onClick={() => toggleFilter('status', s)} />
                    </Badge>
                  );
                })}
                {filters.locations.map(l => {
                  let displayName = l;
                  let groupIcon = <MapPin className="w-3 h-3" />;
                  for (const [group, locations] of Object.entries(locationLabels)) {
                    if (locations[l]) {
                      displayName = locations[l];
                      if (group === 'Mahallahs') groupIcon = <Home className="w-3 h-3" />;
                      if (group === 'Kulliyyahs') groupIcon = <School className="w-3 h-3" />;
                      if (group === 'Facilities') groupIcon = <Building2 className="w-3 h-3" />;
                      break;
                    }
                  }
                  return (
                    <Badge key={l} className="gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border-0 rounded-full text-xs dark:bg-blue-950/30 dark:text-blue-300">
                      {groupIcon}
                      {displayName}
                      <X className="w-3 h-3 cursor-pointer hover:opacity-70 ml-1" onClick={() => toggleFilter('locations', l)} />
                    </Badge>
                  );
                })}
                {(datePreset !== 'all' || customDateFrom || customDateTo) && (
                  <Badge className="gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border-0 rounded-full text-xs dark:bg-purple-950/30 dark:text-purple-300">
                    <Calendar className="w-3 h-3" />{getDateFilterLabel()}
                    <X className="w-3 h-3 cursor-pointer hover:opacity-70 ml-1" onClick={() => { setDatePreset('all'); setCustomDateFrom(''); setCustomDateTo(''); }} />
                  </Badge>
                )}
                {searchQuery && (
                  <Badge className="gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 border-0 rounded-full text-xs dark:bg-slate-700 dark:text-gray-300">
                    <Search className="w-3 h-3" />Search: {searchQuery}
                    <X className="w-3 h-3 cursor-pointer hover:opacity-70 ml-1" onClick={() => setSearchQuery('')} />
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Alerts List */}
          <div className="p-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 animate-spin text-[#D4A853] mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading emergency alerts...</p>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 dark:bg-green-900/30">
                  <CheckCircle className="w-10 h-10 text-green-500 dark:text-green-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No alerts match your filters</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map(alert => (
                  <AlertCard
                    key={alert._id || alert.id}
                    alert={alert}
                    onClick={setSelectedAlert}
                    onAction={handleAction}
                    onDelete={handleDeleteEmergency}
                    isDispatching={isDispatching}
                    isReverting={isReverting}
                    getTimeAgo={getTimeAgo}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.total > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing <span className="font-medium text-gray-700 dark:text-gray-300">{pagination.from}</span> to{' '}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{pagination.to}</span> of{' '}
                  <span className="font-medium text-gray-700 dark:text-gray-300">{pagination.total}</span> alerts
                </p>
                {pagination.last_page > 1 && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Rows:</span>
                      <select
                        value={pagination.per_page}
                        onChange={(e) => handlePerPageChange(parseInt(e.target.value))}
                        className="px-2 py-1.5 border border-gray-200 rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-gray-700 dark:text-gray-300 text-sm focus:ring-2 focus:ring-[#D4A853]/20 focus:border-[#D4A853]"
                      >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.current_page - 1)}
                        disabled={pagination.current_page === 1 || loading}
                        className="rounded-xl border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      <div className="flex gap-1">
                        {getPageNumbers().map((page, idx) =>
                          page === '...' ? (
                            <span key={idx} className="px-3 py-1.5 text-sm text-gray-400 dark:text-gray-500">...</span>
                          ) : (
                            <Button
                              key={page}
                              variant={pagination.current_page === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handlePageChange(page)}
                              disabled={loading}
                              className={`rounded-xl min-w-[36px] ${
                                pagination.current_page === page
                                  ? 'bg-gradient-to-r from-[#D4A853] to-[#C49A48] hover:from-[#C49A48] hover:to-[#B48A38] text-white shadow-md'
                                  : 'border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300'
                              }`}
                            >
                              {page}
                            </Button>
                          )
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.current_page + 1)}
                        disabled={pagination.current_page === pagination.last_page || loading}
                        className="rounded-xl border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AlertDetailModal
        alert={selectedAlert}
        open={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onAction={handleAction}
        onDelete={handleDeleteEmergency}
        formatDate={formatDate}
        getTimeAgo={getTimeAgo}
        isDispatching={isDispatching}
        isReverting={isReverting}
      />

      <ConfirmationModal
        open={showConfirmationModal}
        onClose={() => { setShowConfirmationModal(false); setAlertToResolve(null); }}
        onConfirm={handleConfirmResolve}
        title="Confirm Resolution"
        description="Are you sure you want to mark this emergency alert as resolved?"
        alert={alertToResolve}
        isProcessing={isResolving}
        confirmText="Yes, Resolve"
        confirmColor="green"
      />

      <DecisionModal
        open={showDecisionModal}
        onClose={() => { setShowDecisionModal(false); setAlertForReport(null); }}
        onYes={handleDecisionYes}
        onNo={handleDecisionNo}
        alert={alertForReport}
        formatDate={formatDate}
      />

      <AddEmergencyReport
        isOpen={showAddReportModal}
        onClose={() => { setShowAddReportModal(false); setAlertForReport(null); }}
        onSave={handleSaveReport}
        emergencyData={alertForReport}
      />

      <DispatchOfficerModal
        open={showDispatchModal}
        onClose={() => { setShowDispatchModal(false); setSelectedAlertForDispatch(null); }}
        onDispatch={handleDispatchOfficer}
        alert={selectedAlertForDispatch}
      />
    </DashboardLayout>
  );
};

export default Alerts;
