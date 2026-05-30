import { useState, useRef, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Shield, Search, Filter, ChevronDown, Eye, CheckCircle, XCircle,
  Clock, MapPin, X, RefreshCw,
  ChevronLeft, ChevronRight, Download, Phone, Undo2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

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
        <div className={`absolute top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 min-w-[280px] ${align === 'right' ? 'right-0' : 'left-0'} dark:bg-slate-800 dark:border-slate-700`}>
          {children}
        </div>
      )}
    </div>
  );
};

const Approvals = () => {
  const { auth, allAdmins, flash } = usePage().props;
  const isAdmin = auth?.admins;

  useEffect(() => {
    if (flash?.success) {
      showToast(flash.success, 'success');
    }
    if (flash?.error) {
      showToast(flash.error, 'error');
    }
  }, [flash]);

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter state
  const [filters, setFilters] = useState({
    rank: [],
    department: []
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    if (allAdmins) {
      setAdmins(allAdmins);
      setLoading(false);
    }
  }, [allAdmins]);

  // Get unique departments and ranks for filters
  const allDepartments = [...new Set(admins.map(r => r.department).filter(Boolean))];
  const allRanks = [...new Set(admins.map(r => r.rank).filter(Boolean))];

  // Filter and sort data
  const getFilteredData = () => {
    let data = [...admins];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(r =>
        r.name?.toLowerCase().includes(query) ||
        r.email?.toLowerCase().includes(query) ||
        r.rank?.toLowerCase().includes(query) ||
        r.department?.toLowerCase().includes(query) ||
        r.phone?.includes(query)
      );
    }

    if (filters.department.length > 0) {
      data = data.filter(r => filters.department.includes(r.department));
    }

    if (filters.rank.length > 0) {
      data = data.filter(r => filters.rank.includes(r.rank));
    }

    data.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'created_at') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
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

    return data;
  };

  const filteredData = getFilteredData();
  const totalFiltered = filteredData.length;
  const totalPages = Math.ceil(totalFiltered / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + perPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

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
    setFilters({ department: [], rank: [] });
    setSearchQuery('');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  const hasActiveFilters = filters.department.length > 0 || filters.rank.length > 0 || searchQuery;
  const getFilterCount = () => filters.department.length + filters.rank.length;

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleViewAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowViewDialog(true);
  };

  const openStatusDialog = (admin, status) => {
    setSelectedAdmin(admin);
    setNewStatus(status);
    setRejectionReason('');
    setShowStatusDialog(true);
  };

  const handleUpdateStatus = () => {
    setIsSubmitting(true);
    const adminId = selectedAdmin._id || selectedAdmin.id;

    router.put(`/admin/update-status/${adminId}`, {
      status: newStatus,
      reason: newStatus === 'rejected' ? rejectionReason : null
    }, {
      onSuccess: () => {
        setShowStatusDialog(false);
        setSelectedAdmin(null);
        setNewStatus('');
        setRejectionReason('');
        showToast(`Status updated to ${newStatus}`, 'success');
      },
      onError: (errors) => {
        showToast('Failed to update status', 'error');
        console.error('Status update failed:', errors);
      },
      onFinish: () => setIsSubmitting(false)
    });
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm ${
      type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleRefresh = () => {
    router.reload({ only: ['allAdmins'] });
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    const headers = ['Name', 'Email', 'Phone', 'Rank', 'Department', 'Status', 'Request Date'];
    const csvData = filteredData.map(r => [
      r.name,
      r.email,
      r.phone,
      r.rank,
      r.department,
      r.status,
      new Date(r.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admins_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return null;
    return <ChevronDown className={`w-3 h-3 ml-1 inline transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">Pending</Badge>;
    }
  };

  const pendingCount = admins.filter(a => a.status === 'pending').length;
  const approvedCount = admins.filter(a => a.status === 'approved').length;
  const rejectedCount = admins.filter(a => a.status === 'rejected').length;

  if (!isAdmin) {
    return (
      <DashboardLayout title="Access Denied">
        <Card className="bg-white rounded-2xl shadow-sm dark:bg-slate-800">
          <CardContent className="p-12 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Access Denied</h3>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access this page. This area is restricted to administrators only.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Management" subtitle="Manage all admin registrations">

      {(loading || isSubmitting) && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center dark:bg-black/50">
          <div className="bg-white rounded-lg p-4 shadow-lg dark:bg-slate-800">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A853]"></div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-[#F6EBCA] border-[#D5A642] dark:bg-amber-900/20 dark:border-amber-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#D5A642] flex items-center justify-center dark:bg-amber-700">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#CFE7C4] border-[#41A52B] dark:bg-green-900/20 dark:border-green-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#41A52B] flex items-center justify-center dark:bg-green-700">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{approvedCount}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Approved</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center dark:bg-red-700">
              <XCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{rejectedCount}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="bg-white rounded-2xl shadow-sm border-border dark:bg-slate-800">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">All Admin Registrations</h3>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 rounded-xl border-gray-200 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300" onClick={handleExportCSV}>
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button variant="outline" className="gap-2 rounded-xl border-gray-200 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search by name, email, rank, department..."
                className="pl-10 bg-gray-50 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <SimpleDropdown
              isOpen={showFilterDropdown}
              onClose={() => setShowFilterDropdown(false)}
              align="right"
              trigger={
                <Button
                  variant={getFilterCount() > 0 ? "default" : "outline"}
                  className={`gap-2 rounded-xl relative ${getFilterCount() > 0 ? 'bg-[#D4A853] hover:bg-[#C49A48] text-white' : 'border-gray-200 text-gray-700'} dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700`}
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
              <div className="bg-white p-4 max-h-96 overflow-y-auto rounded-xl min-w-[280px] dark:bg-slate-800">
                <div className="space-y-4">
                  {allRanks.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-200">Rank</Label>
                      <div className="space-y-2">
                        {allRanks.map(rank => (
                          <label key={rank} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded text-gray-700 dark:text-gray-300 dark:hover:bg-slate-700">
                            <input type="checkbox" checked={filters.rank.includes(rank)} onChange={() => toggleFilter('rank', rank)} className="rounded border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-700" />
                            <span className="text-sm">{rank}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-200 my-3 dark:border-slate-700" />

                  {allDepartments.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-200">Department</Label>
                      <div className="space-y-2">
                        {allDepartments.map(dept => (
                          <label key={dept} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded text-gray-700 dark:text-gray-300 dark:hover:bg-slate-700">
                            <input type="checkbox" checked={filters.department.includes(dept)} onChange={() => toggleFilter('department', dept)} className="rounded border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-700" />
                            <span className="text-sm">{dept}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
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
            </div>
          )}

          {/* Table */}
          <div className="rounded-xl border border-gray-200 overflow-hidden dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-600" onClick={() => handleSort('name')}>
                      Name <SortIcon column="name" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-600" onClick={() => handleSort('rank')}>
                      Rank <SortIcon column="rank" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-600" onClick={() => handleSort('department')}>
                      Department <SortIcon column="department" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-600" onClick={() => handleSort('status')}>
                      Status <SortIcon column="status" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-600" onClick={() => handleSort('created_at')}>
                      Request Date <SortIcon column="created_at" />
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100 dark:bg-slate-800 dark:divide-slate-700">
                  {paginatedData.length > 0 ? (
                    paginatedData.map((admin) => (
                      <tr key={admin._id || admin.id} className="hover:bg-gray-50/50 transition-colors dark:hover:bg-slate-700/50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{admin.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{admin.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">{admin.rank}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-400">
                            <MapPin className="w-3 h-3 shrink-0" />{admin.department}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-400">
                            <Phone className="w-3 h-3 shrink-0" />{admin.phone || 'Not provided'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(admin.status || 'pending')}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(admin.created_at)}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-slate-700" onClick={() => handleViewAdmin(admin)}>
                              <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </Button>

                            {(admin.status === 'pending' || !admin.status) && (
                              <>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950/30" onClick={() => openStatusDialog(admin, 'approved')}>
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30" onClick={() => openStatusDialog(admin, 'rejected')}>
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}

                            {(admin.status === 'approved' || admin.status === 'rejected') && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-950/30" onClick={() => openStatusDialog(admin, 'pending')} title="Reset to pending">
                                <Undo2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        {loading ? 'Loading...' : 'No admin registrations found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {totalFiltered > 0 && totalPages > 1 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(startIndex + perPage, totalFiltered)} of {totalFiltered} registrations
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1 || loading} className="rounded-lg border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex gap-1">
                  {getPageNumbers().map((page, idx) =>
                    page === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400">...</span>
                    ) : (
                      <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} disabled={loading} className={`rounded-lg min-w-[36px] ${currentPage === page ? 'bg-[#D4A853] hover:bg-[#C49A48] text-white' : 'border-gray-200 text-gray-700'} dark:border-slate-700 dark:text-gray-300`}>
                        {page}
                      </Button>
                    )
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages || loading} className="rounded-lg border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Admin Modal */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Admin Registration Details</DialogTitle>
          </DialogHeader>
          {selectedAdmin && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs text-gray-500 dark:text-gray-400">Full Name</Label><p className="text-sm font-medium text-gray-900 dark:text-gray-200">{selectedAdmin.name}</p></div>
                <div><Label className="text-xs text-gray-500 dark:text-gray-400">Email</Label><p className="text-sm text-gray-700 dark:text-gray-300">{selectedAdmin.email}</p></div>
                <div><Label className="text-xs text-gray-500 dark:text-gray-400">Phone</Label><p className="text-sm text-gray-700 dark:text-gray-300">{selectedAdmin.phone || 'Not provided'}</p></div>
                <div><Label className="text-xs text-gray-500 dark:text-gray-400">Rank</Label><p className="text-sm text-gray-700 dark:text-gray-300">{selectedAdmin.rank}</p></div>
                <div><Label className="text-xs text-gray-500 dark:text-gray-400">Department</Label><p className="text-sm text-gray-700 dark:text-gray-300">{selectedAdmin.department}</p></div>
                <div><Label className="text-xs text-gray-500 dark:text-gray-400">Status</Label><p className="text-sm text-gray-700 dark:text-gray-300 capitalize">{selectedAdmin.status || 'pending'}</p></div>
                <div><Label className="text-xs text-gray-500 dark:text-gray-400">Request Date</Label><p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(selectedAdmin.created_at)}</p></div>
                {selectedAdmin.rejection_reason && (
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500 dark:text-gray-400">Rejection Reason</Label>
                    <p className="text-sm text-red-600 dark:text-red-400">{selectedAdmin.rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)} className="border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Modal */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              {newStatus === 'approved' ? 'Approve' : newStatus === 'rejected' ? 'Reject' : 'Reset to Pending'} Admin Registration
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Are you sure you want to {newStatus === 'approved' ? 'approve' : newStatus === 'rejected' ? 'reject' : 'reset to pending'}
              {' '}<span className="font-semibold">{selectedAdmin?.name}</span>'s registration?
            </DialogDescription>
          </DialogHeader>
          {newStatus === 'rejected' && (
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">Reason for Rejection (Optional)</Label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A853] text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
          {newStatus === 'pending' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 dark:bg-amber-900/20 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-400">This will reset the status to pending. The user will need to be reviewed again.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)} className="border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300">Cancel</Button>
            <Button
              className={newStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : newStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}
              onClick={handleUpdateStatus} disabled={isSubmitting}
            >
              {newStatus === 'approved' && <CheckCircle className="w-4 h-4 mr-2" />}
              {newStatus === 'rejected' && <XCircle className="w-4 h-4 mr-2" />}
              {newStatus === 'pending' && <Undo2 className="w-4 h-4 mr-2" />}
              {newStatus === 'approved' ? 'Approve' : newStatus === 'rejected' ? 'Reject' : 'Reset to Pending'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Approvals;
