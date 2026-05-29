import { useState, useRef, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Clock, RefreshCw, CheckCircle, Search, Plus,
  Download, Filter, Calendar, MapPin, X, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, Trash2, MoreHorizontal, Eye, Edit
} from 'lucide-react';
import { ReportDetailsModal } from '@/components/dashboard/ReportsDetailsModal';
import { AddReport } from '@/components/dashboard/AddReport';
import { ReportsEditing } from '@/Components/dashboard/ReportsEditing';
import EditableCell from '@/Components/dashboard/EditableCell';
import DeleteConfirmModal from '@/components/dashboard/DeleteConfirmModal';

// ============================================
// CONSTANTS & LABELS
// ============================================
export const categoryLabels = {
  theft: 'Theft/Robbery',
  harassment: 'Harassment',
  vandalism: 'Vandalism',
  fireHazard: 'Fire Hazard',
  suspiciousActivity: 'Suspicious Activity',
  facilityIssue: 'Facility Issue',
  wildAnimal: 'Wild Animal',
  trespassing: 'Trespassing',
  emergency_alert: 'Emergency Alert',
  other: 'Other',
};

export const statusLabels = {
  pending: 'Pending',
  inProgress: 'In Progress',
  resolved: 'Resolved',
};

export const urgencyLabels = {
  general: 'General',
  urgent: 'Urgent',
  null: 'Not Assigned',
};

export const locationLabels = {
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
  'Commercial Areas': {
    '7 Eleven': '7 Eleven',
    'Office': 'Office Buildings',
    'Cafe': 'Cafes & Restaurants',
    'Library': 'Library',
    'Gym': 'Sports Complex',
    'Store': 'Convenience Stores',
    'Shop': 'Shops',
    'Restaurant': 'Restaurants',
    'Food Court': 'Food Court',
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getIncidentLocation = (report) => {
  if (!report) return 'No address specified';

  if (report.location && typeof report.location === 'object') {
    const parts = [];

    if (report.location.locationArea && report.location.locationArea.trim() !== '') {
      const placeNames = ['7 eleven', 'seven eleven', 'office', 'cafe', 'cafeteria', 'library', 'gym', 'store', 'shop', 'restaurant', 'food court'];
      const isPlaceName = placeNames.some(place => report.location.locationArea.toLowerCase().includes(place.toLowerCase()));

      if (!isPlaceName) {
        parts.push(report.location.locationArea);
      }
    }

    if (report.location.specificPlace && report.location.specificPlace.trim() !== '') {
      parts.push(report.location.specificPlace);
    } else if (report.location.building && report.location.building.trim() !== '') {
      parts.push(report.location.building);
    }

    if (parts.length > 0) return parts.join(', ');
    if (report.location.address) return report.location.address;
  }

  return report.address || report.building || report.mahallah || 'No address specified';
};

export const formatLocationName = (location) => {
  if (!location) return '';
  for (const group of Object.values(locationLabels)) {
    for (const [key, label] of Object.entries(group)) {
      if (key === location || label === location) return label;
    }
  }
  return location;
};

// ============================================
// HELPER COMPONENTS
// ============================================

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

// ============================================
// MAIN COMPONENT
// ============================================

const Reports = () => {
  const { reports = { data: [], total: 0, current_page: 1, last_page: 1, per_page: 10 }, statusCounts: initialStatusCounts = { pending: 0, in_progress: 0, resolved: 0 }, filters: serverFilters = {} } = usePage().props;

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddReportOpen, setIsAddReportOpen] = useState(false);
  const [isEditingOpen, setIsEditingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [localReports, setLocalReports] = useState(reports?.data || []);
  const [localStatusCounts, setLocalStatusCounts] = useState(initialStatusCounts);
  const [officersList, setOfficersList] = useState([]);
  const [officerOptions, setOfficerOptions] = useState({});

  const [searchQuery, setSearchQuery] = useState(serverFilters.search || '');
  const [datePreset, setDatePreset] = useState('all');
  const [filters, setFilters] = useState({
    status: serverFilters.status ? serverFilters.status.split(',') : [],
    urgency: serverFilters.urgency ? serverFilters.urgency.split(',') : [],
    category: serverFilters.category ? serverFilters.category.split(',') : [],
    locations: serverFilters.locations ? serverFilters.locations.split(',') : [],
    dateFrom: serverFilters.dateFrom || '',
    dateTo: serverFilters.dateTo || '',
  });

  const [sortConfig, setSortConfig] = useState({
    key: 'reportedAt',
    direction: 'desc'
  });

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const normalise = (r) => {
    let incidentLocation = getIncidentLocation(r);
    let specificPlace = '';
    let buildingDetail = '';
    let locationArea = '';

    if (r.location && typeof r.location === 'object') {
      specificPlace = r.location.specificPlace || '';
      buildingDetail = r.location.building || '';
      locationArea = r.location.locationArea || '';

      const placeNames = ['7 eleven', 'seven eleven', 'office', 'cafe', 'cafeteria', 'library', 'gym', 'store', 'shop', 'restaurant', 'food court'];
      const isPlaceName = placeNames.some(place => locationArea.toLowerCase().includes(place.toLowerCase()));
      if (isPlaceName && !specificPlace) {
        specificPlace = locationArea;
        locationArea = '';
      }
    }

    return {
      id: r.reportId ?? r._id,
      reportId: r.reportId,
      reporterName: r.studentName || '—',
      reporterContact: r.studentPhone || '',
      reporterEmail: r.studentEmail || '',
      reporterMatricNo: r.studentMatrix || '',
      reporterFullName: r.studentName,
      category: r.incidentCategory,
      categoryDisplay: categoryLabels[r.incidentCategory] || r.incidentCategory,
      mahallah: r.mahallah,
      locationArea: locationArea,
      building: buildingDetail,
      specificPlace: specificPlace,
      location: incidentLocation,
      address: r.address,
      locationRaw: r.location,
      description: r.description,
      date: r.incidentDateTime ? new Date(r.incidentDateTime).toLocaleDateString('en-MY') : '—',
      dateRaw: r.incidentDateTime ? new Date(r.incidentDateTime) : null,
      time: r.incidentDateTime ? new Date(r.incidentDateTime).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }) : '',
      urgency: r.urgency ?? 'general',
      urgencyDisplay: urgencyLabels[r.urgency] || r.urgency,
      status: r.status,
      statusDisplay: statusLabels[r.status] || r.status,
      assignedOfficer: r.assignedOfficer ?? null,
      officerName: r.officerName ?? 'Not Assigned',
      injuries: r.injuries,
      attachmentUrls: r.attachmentUrls || [],
      attachmentPublicIds: r.attachmentPublicIds || [],
      reportedAt: r.reportedAt,
      updatedAt: r.updatedAt,
      studentName: r.studentName,
      studentEmail: r.studentEmail,
      studentPhone: r.studentPhone,
      studentMatrix: r.studentMatrix,
      _raw: r,
    };
  };

  const getFilterCount = () => filters.status.length + filters.urgency.length + filters.category.length + filters.locations.length;

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

  const hasActiveFilters = filters.status.length > 0 || filters.urgency.length > 0 || filters.category.length > 0 || filters.locations.length > 0 || filters.dateFrom || filters.dateTo || searchQuery;

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm animate-in slide-in-from-bottom-2 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
    toast.innerHTML = `<div class="flex items-center gap-2">${type === 'success' ? '✓' : '✗'}<span>${message}</span></div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchOfficers = async () => {
    try {
      const response = await fetch('/api/officers/list');
      const officers = await response.json();
      setOfficersList(officers);
      const options = {};
      officers.forEach(officer => {
        options[officer.officerId] = officer.officerName;
      });
      setOfficerOptions(options);
    } catch (error) {
      console.error('Failed to fetch officers:', error);
    }
  };

  // ============================================
  // FILTER HANDLERS
  // ============================================

  const toggleFilter = (filterType, value) => {
    setFilters(prev => {
      const current = prev[filterType];
      const exists = current.includes(value);
      return {
        ...prev,
        [filterType]: exists ? current.filter(v => v !== value) : [...current, value],
      };
    });
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters({ status: [], urgency: [], category: [], locations: [], dateFrom: '', dateTo: '' });
    setDatePreset('all');
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(true);
      router.get(
        '/Reports',
        {
          search: searchQuery || undefined,
          status: filters.status.join(',') || undefined,
          urgency: filters.urgency.join(',') || undefined,
          category: filters.category.join(',') || undefined,
          locations: filters.locations.join(',') || undefined,
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
  }, [searchQuery, filters]);

  // ============================================
  // PAGINATION HANDLERS
  // ============================================

  const currentPage = reports?.current_page ?? 1;
  const totalPages = reports?.last_page ?? 1;
  const startIndex = (currentPage - 1) * (reports?.per_page ?? 10);

  const goToPage = (page) => {
    if (page === currentPage) return;
    setIsLoading(true);
    router.get(
      '/Reports',
      {
        page,
        search: searchQuery || undefined,
        status: filters.status.join(',') || undefined,
        urgency: filters.urgency.join(',') || undefined,
        category: filters.category.join(',') || undefined,
        locations: filters.locations.join(',') || undefined,
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

  // ============================================
  // CRUD HANDLERS
  // ============================================

  const handleManualRefresh = () => {
    setIsLoading(true);
    router.get(
      '/Reports',
      {
        search: searchQuery || undefined,
        status: filters.status.join(',') || undefined,
        urgency: filters.urgency.join(',') || undefined,
        category: filters.category.join(',') || undefined,
        locations: filters.locations.join(',') || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        page: currentPage || undefined,
      },
      {
        preserveState: false,
        preserveScroll: true,
        onFinish: () => setIsLoading(false),
      }
    );
  };

  const handleExportCSV = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filters.status.length) params.append('status', filters.status.join(','));
      if (filters.urgency.length) params.append('urgency', filters.urgency.join(','));
      if (filters.category.length) params.append('category', filters.category.join(','));
      if (filters.locations.length) params.append('locations', filters.locations.join(','));
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      params.append('export', 'true');
      params.append('per_page', '10000');

      const response = await fetch(`/Reports?${params.toString()}`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to fetch reports for export');

      const data = await response.json();
      const allReports = data.data || data.reports?.data || [];

      if (allReports.length === 0) {
        showToast('No reports found matching your filters', 'error');
        setIsLoading(false);
        return;
      }

      const headers = ['Report ID', 'Student ID', 'Student Name', 'Student Email', 'Student Phone', 'Category', 'Incident Location', 'Date', 'Time', 'Urgency', 'Status', 'Assigned Officer', 'Description'];
      const csvData = allReports.map(r => {
        const normalized = normalise(r);
        const escapeCSV = (str) => {
          if (!str) return '';
          if (typeof str !== 'string') str = String(str);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };
        return [
          escapeCSV(r.reportId), escapeCSV(r.studentMatrix || '—'), escapeCSV(r.studentName || '—'),
          escapeCSV(r.studentEmail || '—'), escapeCSV(r.studentPhone || '—'),
          escapeCSV(categoryLabels[r.incidentCategory] || r.incidentCategory || '—'),
          escapeCSV(normalized.location),
          r.incidentDateTime ? new Date(r.incidentDateTime).toLocaleDateString('en-MY') : '—',
          r.incidentDateTime ? new Date(r.incidentDateTime).toLocaleTimeString('en-MY') : '—',
          escapeCSV(urgencyLabels[r.urgency] || r.urgency || '—'),
          escapeCSV(statusLabels[r.status] || r.status || '—'),
          escapeCSV(r.assignedOfficer || '—'), escapeCSV(r.description || '—')
        ];
      });

      const BOM = "\uFEFF";
      const csvContent = BOM + [headers, ...csvData].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      let filename = `reports_${new Date().toISOString().split('T')[0]}.csv`;
      if (filters.dateFrom && filters.dateTo) filename = `reports_${filters.dateFrom}_to_${filters.dateTo}.csv`;
      else if (filters.dateFrom) filename = `reports_from_${filters.dateFrom}.csv`;

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast(`Exported ${allReports.length} reports successfully`, 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Failed to export reports: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openReportDetails = (rawReport) => {
    setSelectedReport(normalise(rawReport));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  const handleReportUpdated = (updatedReport) => {
    setLocalReports(prevReports =>
      prevReports.map(report => {
        if (report.reportId === updatedReport.reportId) {
          return { ...report, ...updatedReport, attachmentUrls: updatedReport.attachmentUrls || report.attachmentUrls, attachmentPublicIds: updatedReport.attachmentPublicIds || report.attachmentPublicIds };
        }
        return report;
      })
    );
    if (updatedReport.oldStatus && updatedReport.status) {
      setLocalStatusCounts(prev => ({ ...prev, [updatedReport.oldStatus]: Math.max(0, (prev[updatedReport.oldStatus] || 0) - 1), [updatedReport.status]: (prev[updatedReport.status] || 0) + 1 }));
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const getSortedReports = () => {
    if (!localReports.length) return [];
    const sorted = [...localReports];
    const { key, direction } = sortConfig;
    const statusOrder = { pending: 1, in_progress: 2, resolved: 3 };
    const urgencyOrder = { urgent: 1, general: 2 };

    sorted.sort((a, b) => {
      let aVal, bVal;
      switch (key) {
        case 'reportId': aVal = a.reportId || ''; bVal = b.reportId || ''; break;
        case 'reporterName': aVal = a.studentName || ''; bVal = b.studentName || ''; break;
        case 'category': aVal = categoryLabels[a.incidentCategory] || a.incidentCategory || ''; bVal = categoryLabels[b.incidentCategory] || b.incidentCategory || ''; break;
        case 'location': aVal = getIncidentLocation(a); bVal = getIncidentLocation(b); break;
        case 'dateTime': aVal = a.incidentDateTime ? new Date(a.incidentDateTime) : new Date(0); bVal = b.incidentDateTime ? new Date(b.incidentDateTime) : new Date(0); break;
        case 'urgency': aVal = urgencyOrder[a.urgency] || 999; bVal = urgencyOrder[b.urgency] || 999; break;
        case 'status': aVal = statusOrder[a.status] || 999; bVal = statusOrder[b.status] || 999; break;
        case 'officerName': aVal = a.officerName || ''; bVal = b.officerName || ''; break;
        default: aVal = a[key] || ''; bVal = b[key] || '';
      }
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  const handleCellUpdate = (reportId, field, newValue, oldValue) => {
    setLocalReports(prevReports =>
      prevReports.map(report => {
        if (report.reportId === reportId) {
          const updated = { ...report };
          if (field === 'status') {
            updated.status = newValue;
            setLocalStatusCounts(prev => {
              const newCounts = { ...prev };
              if (oldValue && newCounts[oldValue] > 0) newCounts[oldValue]--;
              newCounts[newValue]++;
              return newCounts;
            });
          } else if (field === 'urgency') {
            updated.urgency = newValue;
          } else if (field === 'incidentCategory') {
            updated.incidentCategory = newValue;
          }
          return updated;
        }
        return report;
      })
    );
  };

  const handleOfficerUpdate = (reportId, field, newValue) => {
    const selectedOfficer = officersList.find(o => o.officerId === newValue);
    setLocalReports(prevReports =>
      prevReports.map(report => {
        if (report.reportId === reportId) {
          return { ...report, assignedOfficer: newValue, officerName: selectedOfficer?.officerName || 'Not Assigned' };
        }
        return report;
      })
    );
  };

  const handleCreateReport = (newReport) => {
    router.post('/Reports', newReport, {
      onStart: () => setIsLoading(true),
      onSuccess: () => {
        setIsAddReportOpen(false);
        setIsLoading(false);
        showToast('Report created successfully', 'success');
        router.reload({ only: ['reports'] });
      },
      onError: (errors) => {
        console.error('Creation failed:', errors);
        showToast('Failed to create report', 'error');
        setIsLoading(false);
      },
    });
  };

  const handleDeleteReport = (report) => {
    setReportToDelete(report);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!reportToDelete) return;
    setIsDeleting(true);
    router.delete(`/Reports/${reportToDelete.reportId}`, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        setReportToDelete(null);
        showToast('Report deleted successfully', 'success');
        router.reload({ only: ['reports'] });
      },
      onError: (error) => {
        setIsDeleting(false);
        showToast('Failed to delete report', 'error');
        console.error('Delete failed:', error);
      }
    });
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setReportToDelete(null);
  };

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => { fetchOfficers(); }, []);
  useEffect(() => {
    setLocalReports(reports?.data || []);
    setLocalStatusCounts(initialStatusCounts);
  }, [reports?.data, initialStatusCounts]);

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  const renderStatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-[#F6EBCA] border-[#D5A642] dark:bg-amber-900/20 dark:border-amber-700">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#D5A642] dark:bg-amber-700 flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{localStatusCounts?.pending ?? 0}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-[#DAEEFE] border-[#60A8FA] dark:bg-blue-900/20 dark:border-blue-700">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#60A8FA] dark:bg-blue-600 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#60A8FA] dark:text-blue-400">{localStatusCounts?.in_progress ?? 0}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">In Progress</p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-[#CFE7C4] border-[#41A52B] dark:bg-green-900/20 dark:border-green-700">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#41A52B] dark:bg-green-700 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{localStatusCounts?.resolved ?? 0}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Resolved</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ... (rest of your render functions remain the same)

  // ============================================
  // MAIN RETURN
  // ============================================

  return (
    <DashboardLayout title="Reports Management" subtitle="View and manage all incident reports">
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center dark:bg-black/50">
          <div className="bg-white rounded-lg p-4 shadow-lg dark:bg-slate-800">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A853]"></div>
          </div>
        </div>
      )}
      {renderStatsCards()}
      <Card className="bg-white rounded-2xl shadow-sm border-border dark:bg-slate-800">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">All Reports</h3>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 rounded-xl border-gray-200 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300" onClick={handleManualRefresh} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="outline" className="gap-2 rounded-xl border-gray-200 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300" onClick={handleExportCSV} disabled={localReports.length === 0}>
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button className="gap-2 bg-[#D4A853] hover:bg-[#C49A48] text-white rounded-xl" onClick={() => setIsAddReportOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Report
              </Button>
            </div>
          </div>
          {renderFilterBar()}
          {hasActiveFilters && renderActiveFilters()}
          {renderReportsTable()}
          {renderPagination()}
        </CardContent>
      </Card>
      <ReportDetailsModal report={selectedReport} isOpen={isModalOpen} onClose={closeModal} onReportUpdated={handleReportUpdated} />
      <AddReport isOpen={isAddReportOpen} onClose={() => setIsAddReportOpen(false)} onSave={handleCreateReport} />
      <DeleteConfirmModal isOpen={showDeleteConfirm} report={reportToDelete} onConfirm={confirmDelete} onCancel={cancelDelete} isDeleting={isDeleting} />
      <ReportsEditing report={selectedReport} isOpen={isEditingOpen} onClose={() => setIsEditingOpen(false)} onSaveSuccess={handleReportUpdated} />
    </DashboardLayout>
  );
};

export default Reports;
