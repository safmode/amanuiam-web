import { useState, useRef, useEffect, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import {
  Shield, Search, Plus, Phone, MapPin, Mail, Filter, ChevronDown, Eye, Edit,
  Trash2, Activity, Star, TrendingUp, Target, Award, X, ChevronLeft, ChevronRight, Download, MoreHorizontal, User, Loader2, ArrowUpDown, Calendar, ChevronUp,
} from 'lucide-react';
import AddOfficerModal from '@/components/dashboard/AddOfficerModal';
import ViewOfficerModal from '@/components/dashboard/ViewOfficerModal';
import EditOfficerModal from '@/components/dashboard/EditOfficerModal';
import DeleteOfficerModal from '@/components/dashboard/DeleteOfficerModal';

// Simple Dropdown Component
const SimpleDropdown = ({ trigger, children, isOpen, onClose, align = 'left' }) => {
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
        <div className={`absolute top-full mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 z-50 min-w-[280px] ${align === 'right' ? 'right-0' : 'left-0'}`}>
          {children}
        </div>
      )}
    </div>
  );
};

// Sort Icon component
const SortIcon = ({ column, sortBy, sortOrder }) => {
  if (sortBy !== column) return <ChevronDown className="w-3 h-3 opacity-30" />;
  return sortOrder === 'asc'
    ? <ChevronUp className="w-3 h-3" />
    : <ChevronDown className="w-3 h-3" />;
};

const Officers = () => {
  // Get data from Inertia props
  const {
    officers: officersData = { data: [], total: 0, current_page: 1, last_page: 1, per_page: 10 },
    ranks: allRanks = [],
    departments: allDepartments = [],
    filters: serverFilters = {},
    dateFrom: serverDateFrom = '',
    dateTo: serverDateTo = '',
    auth
  } = usePage().props;

  const isAdmin = auth?.admins?.role === 'admin';

  // Local UI state
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // For date preset tracking
  const [datePreset, setDatePreset] = useState('all');

  // Sorting state
  const [sortBy, setSortBy] = useState('officerName');
  const [sortOrder, setSortOrder] = useState('asc');

  // Local state for instant UI updates
  const [localOfficers, setLocalOfficers] = useState(officersData?.data || []);
  const [localTotal, setLocalTotal] = useState(officersData?.total || 0);

  // Update local state when props change
  useEffect(() => {
    setLocalOfficers(officersData?.data || []);
    setLocalTotal(officersData?.total || 0);
  }, [officersData]);

  // Main filters state
  const [searchQuery, setSearchQuery] = useState(serverFilters.search || '');
  const [filters, setFilters] = useState({
    rank: serverFilters.rank ? serverFilters.rank.split(',') : [],
    department: serverFilters.department ? serverFilters.department.split(',') : [],
    dateFrom: serverDateFrom || '',
    dateTo: serverDateTo || '',
  });

  const [newOfficer, setNewOfficer] = useState({ officerName: '', rank: '', department: '', phone: '', email: '' });

  // Temporary state for date dropdown
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');

  // Sort and filter the officers
  const sortedAndFilteredOfficers = useMemo(() => {
    let filtered = [...localOfficers];

    if (filters.rank.length > 0) {
      filtered = filtered.filter(o => filters.rank.includes(o.rank));
    }

    if (filters.department.length > 0) {
      filtered = filtered.filter(o => filters.department.includes(o.department));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.officerName?.toLowerCase().includes(query) ||
        o.rank?.toLowerCase().includes(query) ||
        o.department?.toLowerCase().includes(query) ||
        o.phone?.includes(query)
      );
    }

    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'casesHandled' || sortBy === 'responseRate') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [localOfficers, filters, searchQuery, sortBy, sortOrder]);

  // Send filters to server (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(true);
      router.get(
        '/Officers',
        {
          search: searchQuery || undefined,
          rank: filters.rank.join(',') || undefined,
          department: filters.department.join(',') || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        },
        {
          preserveState: true,
          replace: true,
          onFinish: () => setIsLoading(false),
          onError: (errors) => {
            console.error('Filter application failed:', errors);
            setIsLoading(false);
          }
        }
      );
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, filters.rank, filters.department, filters.dateFrom, filters.dateTo]);

  // Pagination using sorted data
  const currentPage = officersData?.current_page ?? 1;
  const totalFiltered = sortedAndFilteredOfficers.length;
  const totalPages = Math.ceil(totalFiltered / (officersData?.per_page ?? 10));
  const startIndex = (currentPage - 1) * (officersData?.per_page ?? 10);
  const paginatedOfficers = sortedAndFilteredOfficers.slice(startIndex, startIndex + (officersData?.per_page ?? 10));

  // Calculate stats from localOfficers
  const totalCases = localOfficers.reduce((sum, o) => sum + (parseInt(o.casesHandled) || 0), 0);
  const avgResponseRate = localOfficers.length > 0
    ? Math.round(localOfficers.reduce((sum, o) => sum + (o.responseRate || 0), 0) / localOfficers.length)
    : 0;

  // Find top performer based on response rate (with full name)
  const topPerformer = localOfficers.reduce((best, current) => {
    const currentRate = current.responseRate || 0;
    const bestRate = best?.responseRate || 0;
    return currentRate > bestRate ? current : best;
  }, localOfficers[0]);

  const stats = {
    total: localTotal,
    totalCases: totalCases,
    avgResponseRate: avgResponseRate,
    topPerformer: topPerformer
  };

  // Date filter helpers
  const applyDatePreset = (preset) => {
    const today = new Date();
    let dateFrom = '';
    let dateTo = '';

    if (preset === 'today') {
        dateFrom = today.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        setDatePreset('today');
    } else if (preset === 'week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
        dateFrom = startOfWeek.toISOString().split('T')[0];
        dateTo = endOfWeek.toISOString().split('T')[0];
        setDatePreset('week');
    } else if (preset === 'month') {
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        dateTo = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        setDatePreset('month');
    }

    setFilters(prev => ({ ...prev, dateFrom, dateTo }));
    setShowDateDropdown(false);
  };

  const applyCustomDateRange = () => {
    if (tempDateFrom && tempDateTo) {
        setFilters(prev => ({ ...prev, dateFrom: tempDateFrom, dateTo: tempDateTo }));
        setDatePreset('custom');
        setShowDateDropdown(false);
    }
  };

  // Helper functions for date dropdown
  const getDateFilterLabel = () => {
    if (datePreset === 'today') return 'Today';
    if (datePreset === 'week') return 'This Week';
    if (datePreset === 'month') return 'This Month';
    if (datePreset === 'custom' && filters.dateFrom && filters.dateTo) return `${filters.dateFrom} - ${filters.dateTo}`;
    if (filters.dateFrom && filters.dateTo) return `${filters.dateFrom} - ${filters.dateTo}`;
    if (filters.dateFrom) return `From ${filters.dateFrom}`;
    if (filters.dateTo) return `Until ${filters.dateTo}`;
    return 'Date Range';
  };

  const clearDateFilters = () => {
    setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }));
    setDatePreset('all');
    setTempDateFrom('');
    setTempDateTo('');
    setShowDateDropdown(false);
  };

  // UTILS
  const getPerformanceBadge = (rate) => {
    if (rate >= 90) return { className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', label: 'Excellent', icon: <Award className="w-3 h-3" /> };
    if (rate >= 75) return { className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', label: 'Good', icon: <TrendingUp className="w-3 h-3" /> };
    if (rate >= 60) return { className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', label: 'Average', icon: <Target className="w-3 h-3" /> };
    return { className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', label: 'Needs Improvement', icon: <Activity className="w-3 h-3" /> };
  };

  const getRoleBadge = (rank) => {
    if (rank?.toLowerCase().includes('senior')) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">{rank}</Badge>;
    }
    if (rank?.toLowerCase().includes('junior')) {
      return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">{rank}</Badge>;
    }
    return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">{rank}</Badge>;
  };

  const toggleFilter = (filterType, value) => {
    setFilters(prev => {
      const currentValues = prev[filterType];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterType]: newValues };
    });
  };

  const clearAllFilters = () => {
    setFilters({ rank: [], department: [], dateFrom: '', dateTo: '' });
    setSearchQuery('');
    setSortBy('officerName');
    setSortOrder('asc');
  };

  const hasActiveFilters = filters.rank.length > 0 || filters.department.length > 0 || searchQuery || filters.dateFrom || filters.dateTo;
  const getFilterCount = () => filters.rank.length + filters.department.length;

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const goToPage = (page) => {
    if (page === currentPage) return;
    setIsLoading(true);
    router.get(
      '/Officers',
      {
        page,
        search: searchQuery || undefined,
        rank: filters.rank.join(',') || undefined,
        department: filters.department.join(',') || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      },
      {
        preserveState: true,
        replace: true,
        onFinish: () => setIsLoading(false),
        onError: () => setIsLoading(false)
      }
    );
  };

  const getPageNumbers = () => {
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
  };

  // HANDLERS
  const handleAddOfficer = (newOfficer) => {
    router.post('/Officers', newOfficer, {
      onStart: () => setIsLoading(true),
      onSuccess: () => {
        setShowAddDialog(false);
        setIsLoading(false);
      },
      onError: (errors) => {
        console.error('Creation failed:', errors);
        setIsLoading(false);
      },
    });
  };

  const handleViewOfficer = (officer) => {
    setSelectedOfficer(officer);
    setShowViewDialog(true);
  };

  const handleEditOfficer = (officer) => {
    setSelectedOfficer(officer);
    setNewOfficer({
      officerName: officer.officerName,
      rank: officer.rank,
      department: officer.department,
      phone: officer.phone,
      email: officer.email || ''
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = (editedOfficerData) => {
    router.put(`/Officers/${selectedOfficer.officerId}`, editedOfficerData, {
      onStart: () => setIsLoading(true),
      onSuccess: () => {
        setShowEditDialog(false);
        setSelectedOfficer(null);
        setIsLoading(false);
        showToast('Officer updated successfully', 'success');
        router.reload({ only: ['officers'] });
      },
      onError: (errors) => {
        setIsLoading(false);
        showToast('Failed to update officer', 'error');
        console.error('Update failed:', errors);
      },
    });
  };

  const handleDeleteClick = (officer) => {
    setSelectedOfficer(officer);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!selectedOfficer) return;

    setIsDeleting(true);
    router.delete(`/Officers/${selectedOfficer.officerId}`, {
      onStart: () => setIsLoading(true),
      onSuccess: () => {
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        setSelectedOfficer(null);
        showToast('Officer deleted successfully', 'success');
        router.reload({ only: ['officers'] });
      },
      onError: (errors) => {
        console.error('Delete failed:', errors);
        setIsDeleting(false);
        showToast('Failed to delete officer', 'error');
      },
      onFinish: () => {
        setIsLoading(false);
      },
    });
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
    const currentOfficers = sortedAndFilteredOfficers;
    if (currentOfficers.length === 0) return;

    const headers = ['Officer ID', 'Name', 'Rank', 'Department', 'Phone', 'Email', 'Cases Handled', 'Response Rate'];
    const csvData = currentOfficers.map(o => [
      o.officerId,
      o.officerName,
      o.rank,
      o.department,
      o.phone,
      o.email || '',
      o.casesHandled || 0,
      `${o.responseRate || 0}%`
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `officers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="Officers Performance" subtitle="Track and evaluate security officer performance metrics">

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A853]"></div>
            </div>
        </div>
      )}

      {/* PERFORMANCE STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-[#F6EBCA] border-[#D5A642] dark:bg-amber-900/20 dark:border-amber-700">
            <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#D5A642] dark:bg-amber-700 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.total}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Officers</p>
            </div>
            </CardContent>
        </Card>

        <Card className="bg-[#DAEEFE] border-[#60A8FA] dark:bg-blue-900/20 dark:border-blue-700">
            <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#60A8FA] dark:bg-blue-600 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-2xl font-bold text-[#60A8FA] dark:text-blue-400">{stats.totalCases}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Cases</p>
            </div>
            </CardContent>
        </Card>

        <Card className="bg-[#CFE7C4] border-[#41A52B] dark:bg-green-900/20 dark:border-green-700">
            <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#41A52B] dark:bg-green-700 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.avgResponseRate}%</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Avg Response</p>
            </div>
            </CardContent>
        </Card>

        <Card className="bg-[#E9E9E9] border-[#5F6368] dark:bg-slate-700 dark:border-slate-600">
            <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#5F6368] dark:bg-gray-600 flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
            </div>
            <div>
                {/* Show FULL NAME of top performer */}
                <p className="text-base font-bold text-[#5F6368] dark:text-gray-300 truncate max-w-[150px]" title={stats.topPerformer?.officerName || '-'}>
                  {stats.topPerformer?.officerName || '-'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Top Performer</p>
                {stats.topPerformer && (
                  <p className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">
                    {stats.topPerformer.responseRate || 0}% response rate
                  </p>
                )}
            </div>
            </CardContent>
        </Card>
      </div>

      {/* All Officers Card */}
      <Card className="bg-white rounded-2xl shadow-sm border-border dark:bg-slate-800">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">All Officers</h3>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 rounded-xl border-gray-200 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300" onClick={handleExportCSV}>
                <Download className="w-4 h-4" />
                    Export CSV
              </Button>
              {isAdmin && (
                <Button
                  className="gap-2 bg-[#D4A853] hover:bg-[#C49A48] text-white rounded-xl"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add Officer
                </Button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search officers by name, rank, department..."
                className="pl-10 bg-gray-50 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Dropdown */}
            <SimpleDropdown
              isOpen={showFilterDropdown}
              onClose={() => setShowFilterDropdown(false)}
              align="right"
              trigger={
                <Button
                    variant="outline"
                    className={`gap-2 rounded-xl relative border-gray-200 text-gray-700 ${getFilterCount() > 0 ? 'bg-[#D4A853] hover:bg-[#C49A48] text-white' : ''} dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700`}
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    >
                    <Filter className="w-4 h-4" />
                    Filters
                    {getFilterCount() > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {getFilterCount()}
                        </span>
                    )}
                    <ChevronDown className="w-4 h-4" />
                </Button>
              }
            >
              <div className="bg-white dark:bg-slate-800 p-4 max-h-96 overflow-y-auto rounded-xl min-w-[280px]">
                <div className="space-y-4">
                    {/* Rank Filter */}
                    <div>
                    <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Rank</Label>
                        {filters.rank.length > 0 && (
                        <button onClick={() => setFilters(prev => ({ ...prev, rank: [] }))} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Clear</button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {allRanks.map(rank => (
                        <label key={rank} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 p-1 rounded">
                            <input
                            type="checkbox"
                            checked={filters.rank.includes(rank)}
                            onChange={() => toggleFilter('rank', rank)}
                            className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-700"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{rank}</span>
                        </label>
                        ))}
                    </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-slate-700" />

                    {/* Department Filter */}
                    <div>
                    <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Department</Label>
                        {filters.department.length > 0 && (
                        <button onClick={() => setFilters(prev => ({ ...prev, department: [] }))} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Clear</button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {allDepartments.map(dept => (
                        <label key={dept} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 p-1 rounded">
                            <input
                            type="checkbox"
                            checked={filters.department.includes(dept)}
                            onChange={() => toggleFilter('department', dept)}
                            className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-700"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{dept}</span>
                        </label>
                        ))}
                    </div>
                    </div>
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
                variant="outline"
                className={`gap-2 rounded-xl relative border-gray-200 text-gray-700 ${(filters.dateFrom || filters.dateTo) ? 'bg-[#D4A853] hover:bg-[#C49A48] text-white' : ''} dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700`}
                onClick={() => {
                    setTempDateFrom(filters.dateFrom);
                    setTempDateTo(filters.dateTo);
                    setShowDateDropdown(!showDateDropdown);
                }}
                >
                <Calendar className="w-4 h-4" />
                {getDateFilterLabel()}
                {(filters.dateFrom || filters.dateTo) && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">1</span>
                )}
                <ChevronDown className="w-4 h-4" />
                </Button>
            }
            >
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl min-w-[260px] border border-gray-200 dark:border-slate-700">
                <div className="space-y-4">
                <div>
                    <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Time Period</Label>
                    {(filters.dateFrom || filters.dateTo) && (
                        <button onClick={() => clearDateFilters()} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Clear</button>
                    )}
                    </div>
                    <div className="space-y-2">
                    <button
                        onClick={() => applyDatePreset('today')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-gray-700 dark:text-gray-300 ${datePreset === 'today' ? 'bg-[#D4A853] text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => applyDatePreset('week')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-gray-700 dark:text-gray-300 ${datePreset === 'week' ? 'bg-[#D4A853] text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                    >
                        This Week
                    </button>
                    <button
                        onClick={() => applyDatePreset('month')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-gray-700 dark:text-gray-300 ${datePreset === 'month' ? 'bg-[#D4A853] text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                    >
                        This Month
                    </button>
                    <button
                        onClick={() => {
                        setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }));
                        setDatePreset('all');
                        setShowDateDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-gray-700 dark:text-gray-300 ${datePreset === 'all' ? 'bg-[#D4A853] text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
                    >
                        All Time
                    </button>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-slate-700" />

                <div>
                    <Label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-200">Custom Range</Label>
                    <div className="space-y-3">
                    <div>
                        <Label className="text-xs text-gray-500 mb-1 block dark:text-gray-400">From</Label>
                        <Input
                        type="date"
                        value={tempDateFrom}
                        onChange={(e) => setTempDateFrom(e.target.value)}
                        className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-lg text-sm h-9 text-gray-900 dark:text-gray-200"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-gray-500 mb-1 block dark:text-gray-400">To</Label>
                        <Input
                        type="date"
                        value={tempDateTo}
                        onChange={(e) => setTempDateTo(e.target.value)}
                        className="bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-lg text-sm h-9 text-gray-900 dark:text-gray-200"
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button
                        className="flex-1 bg-[#D4A853] hover:bg-[#C49A48] rounded-lg text-white"
                        onClick={() => {
                            if (tempDateFrom && tempDateTo) {
                            setFilters(prev => ({ ...prev, dateFrom: tempDateFrom, dateTo: tempDateTo }));
                            setDatePreset('custom');
                            setShowDateDropdown(false);
                            }
                        }}
                        disabled={!tempDateFrom || !tempDateTo}
                        >
                        Apply
                        </Button>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </SimpleDropdown>

            {hasActiveFilters && (
                <Button variant="ghost" className="gap-2 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30" onClick={clearAllFilters}>
                    <X className="w-4 h-4" />
                    Clear All
                </Button>
              )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mb-4 flex flex-wrap gap-2">
              {filters.rank.map(rank => (
                <Badge key={rank} variant="secondary" className="gap-1 px-2 py-1 bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600">
                    {rank}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => toggleFilter('rank', rank)} />
                </Badge>
              ))}
              {filters.department.map(dept => (
                <Badge key={dept} variant="secondary" className="gap-1 px-2 py-1 bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600">
                  <MapPin className="w-3 h-3" />
                  {dept}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => toggleFilter('department', dept)} />
                </Badge>
              ))}
              {(filters.dateFrom || filters.dateTo) && (
                <Badge key="date-range" variant="secondary" className="gap-1 px-2 py-1 bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600">
                  <Calendar className="w-3 h-3" />
                  {filters.dateFrom && filters.dateTo
                    ? `${filters.dateFrom} to ${filters.dateTo}`
                    : filters.dateFrom ? `From ${filters.dateFrom}` : `To ${filters.dateTo}`}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }))} />
                </Badge>
              )}
            </div>
          )}

          {/* Officers Table */}
          <div className="rounded-xl border border-gray-200 overflow-hidden dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-[100px] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleSort('officerId')}
                    >
                      <div className="flex items-center gap-1">
                        ID <SortIcon column="officerId" sortBy={sortBy} sortOrder={sortOrder} />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-[180px] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleSort('officerName')}
                    >
                      <div className="flex items-center gap-1">
                        Officer <SortIcon column="officerName" sortBy={sortBy} sortOrder={sortOrder} />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-[130px] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleSort('rank')}
                    >
                      <div className="flex items-center gap-1">
                        Rank <SortIcon column="rank" sortBy={sortBy} sortOrder={sortOrder} />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-[150px] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleSort('department')}
                    >
                      <div className="flex items-center gap-1">
                        Department <SortIcon column="department" sortBy={sortBy} sortOrder={sortOrder} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-[130px]">Phone</th>
                    <th
                      className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-200 w-[110px] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleSort('casesHandled')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Cases <SortIcon column="casesHandled" sortBy={sortBy} sortOrder={sortOrder} />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-200 w-[110px] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                      onClick={() => handleSort('responseRate')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Response Rate <SortIcon column="responseRate" sortBy={sortBy} sortOrder={sortOrder} />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-200 w-[120px]">Performance</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-200 w-[80px]">Actions</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-200 w-[50px]"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 dark:bg-slate-800 dark:divide-slate-700">
                  {paginatedOfficers.length > 0 ? (
                    paginatedOfficers.map((officer) => {
                      const perfBadge = getPerformanceBadge(officer.responseRate || 0);
                      return (
                        <tr
                          key={officer.officerId}
                          className="hover:bg-gray-50/50 cursor-pointer transition-colors group dark:hover:bg-slate-700/50"
                          onClick={() => handleViewOfficer(officer)}
                        >
                          <td className="px-4 py-3 text-sm font-mono text-[#D4A853] dark:text-amber-500">{officer.officerId || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{officer.officerName}</p>
                          </td>
                          <td className="px-4 py-3">{getRoleBadge(officer.rank)}</td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {officer.department}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                              <Phone className="w-3 h-3 shrink-0" />
                              {officer.phone}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-bold text-gray-800 dark:text-white">
                              {officer.casesHandled || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">
                              {officer.responseRate || 0}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline" className={`${perfBadge.className} text-xs font-medium gap-1`}>
                              {perfBadge.icon}
                              {perfBadge.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                                    <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl min-w-[160px] dark:bg-slate-800 dark:border-slate-700">
                                  <DropdownMenuItem onClick={() => handleViewOfficer(officer)} className="gap-2 cursor-pointer hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30 dark:hover:text-amber-400">
                                    <Eye className="w-4 h-4" /><span>View Performance</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditOfficer(officer)} className="gap-2 cursor-pointer hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30 dark:hover:text-amber-400">
                                    <Edit className="w-4 h-4" /><span>Edit Officer</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="dark:bg-slate-700" />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(officer)}
                                    className="gap-2 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                                  >
                                    <Trash2 className="w-4 h-4" /><span>Delete Officer</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(officer);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="10" className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        No officers found matching your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalFiltered > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(startIndex + (officersData?.per_page ?? 10), totalFiltered)} of {totalFiltered} officers
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className="rounded-lg border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex gap-1">
                    {getPageNumbers().map((page, idx) =>
                      page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400">...</span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(page)}
                          disabled={isLoading}
                          className={`rounded-lg min-w-[36px] ${currentPage === page ? 'bg-[#D4A853] hover:bg-[#C49A48] text-white' : 'border-gray-200 text-gray-700'} dark:border-slate-700 dark:text-gray-300`}
                        >
                          {page}
                        </Button>
                      )
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    className="rounded-lg border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddOfficerModal
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddOfficer}
        isLoading={isLoading}
      />

      <ViewOfficerModal
        isOpen={showViewDialog}
        onClose={() => setShowViewDialog(false)}
        officer={selectedOfficer}
        onEdit={handleEditOfficer}
        isAdmin={isAdmin}
      />

      <EditOfficerModal
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        officer={selectedOfficer}
        onSave={handleSaveEdit}
        ranks={allRanks}
        departments={allDepartments}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteOfficerModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        officer={selectedOfficer}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </DashboardLayout>
  );
};

export default Officers;
