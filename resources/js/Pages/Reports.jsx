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
  Clock, RefreshCw, CheckCircle, XCircle, Search, Plus,
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

// Comprehensive location labels for filtering
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

// Helper function to get incident location from report
const getIncidentLocation = (report) => {
  if (!report) return 'No address specified';

  // DIRECT ACCESS: Your database stores location as a direct object
  if (report.location && typeof report.location === 'object') {
    const parts = [];

    // Add locationArea if exists and not a place name
    if (report.location.locationArea && report.location.locationArea.trim() !== '') {
      // Check if locationArea is actually a place name
      const placeNames = ['7 eleven', 'seven eleven', 'office', 'cafe', 'cafeteria', 'library', 'gym', 'store', 'shop', 'restaurant', 'food court'];
      const isPlaceName = placeNames.some(place => report.location.locationArea.toLowerCase().includes(place.toLowerCase()));

      if (!isPlaceName) {
        parts.push(report.location.locationArea);
      }
    }

    // Add specificPlace (business names like "7 Eleven")
    if (report.location.specificPlace && report.location.specificPlace.trim() !== '') {
      parts.push(report.location.specificPlace);
    }
    // Add building if exists and no specificPlace
    else if (report.location.building && report.location.building.trim() !== '') {
      parts.push(report.location.building);
    }

    if (parts.length > 0) {
      return parts.join(', ');
    }

    // Fallback to address
    if (report.location.address) {
      return report.location.address;
    }
  }

  // Fallback to old fields
  if (report.address) return report.address;
  if (report.building) return report.building;
  if (report.mahallah) return report.mahallah;

  return 'No address specified';
};

// Helper function to match location text to predefined label
const matchLocationToLabel = (locationText) => {
  if (!locationText) return null;

  // Flatten all location labels for matching
  const allLocations = {};
  Object.values(locationLabels).forEach(group => {
    Object.assign(allLocations, group);
  });

  // Check for exact match first
  if (allLocations[locationText]) return locationText;

  // Check if location text contains any of our predefined locations
  for (const [key, label] of Object.entries(allLocations)) {
    if (locationText.toLowerCase().includes(key.toLowerCase()) ||
        locationText.toLowerCase().includes(label.toLowerCase())) {
      return key;
    }
  }

  return null;
};

export const formatLocationName = (location) => {
  if (!location) return '';
  // Flatten the location labels to find display name
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
  const { reports = { data: [], total: 0, current_page: 1, last_page: 1, per_page: 10 }, statusCounts: initialStatusCounts = { pending: 0, in_progress: 0, resolved: 0 }, uniqueLocations = [], filters: serverFilters = {} } = usePage().props;

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  // UI State
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddReportOpen, setIsAddReportOpen] = useState(false);
  const [isEditingOpen, setIsEditingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dropdown States
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Delete State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Data State
  const [localReports, setLocalReports] = useState(reports?.data || []);
  const [localStatusCounts, setLocalStatusCounts] = useState(initialStatusCounts);
  const [officersList, setOfficersList] = useState([]);
  const [officerOptions, setOfficerOptions] = useState({});

  // Search & Filter State
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
    console.log('Raw report location:', r.location);

    // Get the incident location using the improved function
    let incidentLocation = getIncidentLocation(r);

    // Extract specific place for editing
    let specificPlace = '';
    let buildingDetail = '';
    let locationArea = '';

    if (r.location && typeof r.location === 'object') {
      specificPlace = r.location.specificPlace || '';
      buildingDetail = r.location.building || '';
      locationArea = r.location.locationArea || '';

      // If locationArea contains a place name, move it to specificPlace for display
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

  const getAllLocationKeys = () => {
    const keys = [];
    const labels = {};
    Object.values(locationLabels).forEach(group => {
      Object.entries(group).forEach(([key, label]) => {
        keys.push(key);
        labels[key] = label;
      });
    });
    return { keys, labels };
  };

  const { locationKeys, locationLabelsFlat } = getAllLocationKeys();

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

  // Apply filters to server (debounced)
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
        // Build query parameters from current filters
        const params = new URLSearchParams();

        if (searchQuery) params.append('search', searchQuery);
        if (filters.status.length) params.append('status', filters.status.join(','));
        if (filters.urgency.length) params.append('urgency', filters.urgency.join(','));
        if (filters.category.length) params.append('category', filters.category.join(','));
        if (filters.locations.length) params.append('locations', filters.locations.join(','));
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);

        // Add parameter to get all records (no pagination)
        params.append('export', 'true');
        params.append('per_page', '10000'); // Get a large number of records

        // Fetch all filtered reports from the server
        const response = await fetch(`/Reports?${params.toString()}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch reports for export');
        }

        const data = await response.json();
        const allReports = data.data || data.reports?.data || [];

        if (allReports.length === 0) {
            showToast('No reports found matching your filters', 'error');
            setIsLoading(false);
            return;
        }

        // Define CSV headers
        const headers = [
            'Report ID', 'Student ID', 'Student Name', 'Student Email', 'Student Phone',
            'Category', 'Incident Location', 'Date', 'Time', 'Urgency', 'Status',
            'Assigned Officer', 'Description'
        ];

        // Generate CSV data
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
                escapeCSV(r.reportId),
                escapeCSV(r.studentMatrix || '—'),
                escapeCSV(r.studentName || '—'),
                escapeCSV(r.studentEmail || '—'),
                escapeCSV(r.studentPhone || '—'),
                escapeCSV(categoryLabels[r.incidentCategory] || r.incidentCategory || '—'),
                escapeCSV(normalized.location),
                r.incidentDateTime ? new Date(r.incidentDateTime).toLocaleDateString('en-MY') : '—',
                r.incidentDateTime ? new Date(r.incidentDateTime).toLocaleTimeString('en-MY') : '—',
                escapeCSV(urgencyLabels[r.urgency] || r.urgency || '—'),
                escapeCSV(statusLabels[r.status] || r.status || '—'),
                escapeCSV(r.assignedOfficer || '—'),
                escapeCSV(r.description || '—')
            ];
        });

        // Add BOM for UTF-8 to handle special characters in Excel
        const BOM = "\uFEFF";
        const csvContent = BOM + [headers, ...csvData].map(row => row.join(',')).join('\n');

        // Download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Create filename with date range
        let filename = 'reports';
        if (filters.dateFrom && filters.dateTo) {
            filename += `_${filters.dateFrom}_to_${filters.dateTo}`;
        } else if (filters.dateFrom) {
            filename += `_from_${filters.dateFrom}`;
        } else if (filters.dateTo) {
            filename += `_until_${filters.dateTo}`;
        } else {
            filename += `_${new Date().toISOString().split('T')[0]}`;
        }
        filename += '.csv';

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
    const normalized = normalise(rawReport);
    setSelectedReport(normalized);
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
          return {
            ...report,
            ...updatedReport,
            attachmentUrls: updatedReport.attachmentUrls || report.attachmentUrls,
            attachmentPublicIds: updatedReport.attachmentPublicIds || report.attachmentPublicIds,
          };
        }
        return report;
      })
    );

    if (updatedReport.oldStatus && updatedReport.status) {
      setLocalStatusCounts(prev => ({
        ...prev,
        [updatedReport.oldStatus]: Math.max(0, (prev[updatedReport.oldStatus] || 0) - 1),
        [updatedReport.status]: (prev[updatedReport.status] || 0) + 1
      }));
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getSortedReports = () => {
    if (!localReports.length) return [];

    const sorted = [...localReports];
    const { key, direction } = sortConfig;

    sorted.sort((a, b) => {
        let aVal, bVal;

        switch (key) {
        case 'reportId':
            aVal = a.reportId || '';
            bVal = b.reportId || '';
            break;
        case 'reporterName':
            aVal = a.studentName || '';
            bVal = b.studentName || '';
            break;
        case 'category':
            aVal = categoryLabels[a.incidentCategory] || a.incidentCategory || '';
            bVal = categoryLabels[b.incidentCategory] || b.incidentCategory || '';
            break;
        case 'location':
            aVal = getIncidentLocation(a);
            bVal = getIncidentLocation(b);
            break;
        case 'dateTime':
            aVal = a.incidentDateTime ? new Date(a.incidentDateTime) : new Date(0);
            bVal = b.incidentDateTime ? new Date(b.incidentDateTime) : new Date(0);
            break;
        case 'urgency':
            const urgencyOrder = { urgent: 1, general: 2 };
            aVal = urgencyOrder[a.urgency] || 999;
            bVal = urgencyOrder[b.urgency] || 999;
            break;
        case 'status':
            const statusOrder = { pending: 1, in_progress: 2, resolved: 3 };
            aVal = statusOrder[a.status] || 999;
            bVal = statusOrder[b.status] || 999;
            break;
        case 'officerName':
            aVal = a.officerName || '';
            bVal = b.officerName || '';
            break;
        default:
            aVal = a[key] || '';
            bVal = b[key] || '';
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

  const handleOfficerUpdate = (reportId, field, newValue, oldValue) => {
    const selectedOfficer = officersList.find(o => o.officerId === newValue);
    setLocalReports(prevReports =>
      prevReports.map(report => {
        if (report.reportId === reportId) {
          return {
            ...report,
            assignedOfficer: newValue,
            officerName: selectedOfficer?.officerName || 'Not Assigned'
          };
        }
        return report;
      })
    );
  };

  const handleCreateReport = (newReport) => {
    router.post('/Reports', newReport, {
      onStart: () => setIsLoading(true),
      onSuccess: (response) => {
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
  useEffect(() => {
    fetchOfficers();
  }, []);

  useEffect(() => {
    setLocalReports(reports?.data || []);
    setLocalStatusCounts(initialStatusCounts);
  }, [reports?.data, initialStatusCounts]);

  // ============================================
  // RENDER COMPONENTS
  // ============================================
  const renderStatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Pending Card */}
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

        {/* In Progress Card */}
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

        {/* Resolved Card */}
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

  const renderFilterBar = () => (
    <div className="flex flex-wrap gap-3 mb-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <Input
          placeholder="Search reports by ID, description, location..."
          className="pl-10 bg-gray-50 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:placeholder:text-gray-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Status/Urgency/Category Filter Dropdown */}
      <SimpleDropdown
        isOpen={showFilterDropdown}
        onClose={() => setShowFilterDropdown(false)}
        align="left"
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
            {/* Status */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Status</Label>
                {filters.status.length > 0 && (
                  <button onClick={() => setFilters(prev => ({ ...prev, status: [] }))} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Clear</button>
                )}
              </div>
              <div className="space-y-2">
                {Object.entries(statusLabels).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded dark:hover:bg-slate-700">
                    <input type="checkbox" checked={filters.status.includes(key)} onChange={() => toggleFilter('status', key)} className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-700" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-slate-700" />

            {/* Urgency */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Urgency</Label>
                {filters.urgency.length > 0 && (
                  <button onClick={() => setFilters(prev => ({ ...prev, urgency: [] }))} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Clear</button>
                )}
              </div>
              <div className="space-y-2">
                {Object.entries(urgencyLabels).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded dark:hover:bg-slate-700">
                    <input type="checkbox" checked={filters.urgency.includes(key)} onChange={() => toggleFilter('urgency', key)} className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-700" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-slate-700" />

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Category</Label>
                {filters.category.length > 0 && (
                  <button onClick={() => setFilters(prev => ({ ...prev, category: [] }))} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Clear</button>
                )}
              </div>
              <div className="space-y-2">
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded dark:hover:bg-slate-700">
                    <input type="checkbox" checked={filters.category.includes(key)} onChange={() => toggleFilter('category', key)} className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-700" />
                    <span className="text-sm truncate text-gray-700 dark:text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
            <Button variant="ghost" size="sm" onClick={() => { setFilters(prev => ({ ...prev, status: [], urgency: [], category: [] })); setShowFilterDropdown(false); }} className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30">
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
            variant={(filters.dateFrom || filters.dateTo) ? "default" : "outline"}
            className={`gap-2 rounded-xl ${(filters.dateFrom || filters.dateTo) ? 'bg-[#D4A853] hover:bg-[#C49A48] text-white' : 'border-gray-200 text-gray-700'} dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700`}
            onClick={() => setShowDateDropdown(!showDateDropdown)}
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
        <div className="bg-white p-4 rounded-xl min-w-[260px] dark:bg-slate-800">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Time Period</Label>
                {(filters.dateFrom || filters.dateTo) && (
                  <button onClick={() => { setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' })); setDatePreset('all'); setShowDateDropdown(false); }} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Clear</button>
                )}
              </div>
              <div className="space-y-2">
                <button onClick={() => { const today = new Date(); const dateStr = today.toISOString().split('T')[0]; setFilters(prev => ({ ...prev, dateFrom: dateStr, dateTo: dateStr })); setDatePreset('today'); setShowDateDropdown(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-gray-700 dark:text-gray-300 ${datePreset === 'today' ? 'bg-[#D4A853] text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>Today</button>
                <button onClick={() => { const today = new Date(); const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay()); const endOfWeek = new Date(today); endOfWeek.setDate(today.getDate() + (6 - today.getDay())); setFilters(prev => ({ ...prev, dateFrom: startOfWeek.toISOString().split('T')[0], dateTo: endOfWeek.toISOString().split('T')[0] })); setDatePreset('week'); setShowDateDropdown(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-gray-700 dark:text-gray-300 ${datePreset === 'week' ? 'bg-[#D4A853] text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>This Week</button>
                <button onClick={() => { const today = new Date(); const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); setFilters(prev => ({ ...prev, dateFrom: startOfMonth.toISOString().split('T')[0], dateTo: endOfMonth.toISOString().split('T')[0] })); setDatePreset('month'); setShowDateDropdown(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-gray-700 dark:text-gray-300 ${datePreset === 'month' ? 'bg-[#D4A853] text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>This Month</button>
                <button onClick={() => { setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' })); setDatePreset('all'); setShowDateDropdown(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors text-gray-700 dark:text-gray-300 ${datePreset === 'all' ? 'bg-[#D4A853] text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>All Time</button>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-slate-700" />

            <div>
              <Label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-200">Custom Range</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block dark:text-gray-400">From</Label>
                  <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))} className="bg-gray-50 border-gray-200 rounded-lg text-sm h-9 text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block dark:text-gray-400">To</Label>
                  <Input type="date" value={filters.dateTo} onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))} className="bg-gray-50 border-gray-200 rounded-lg text-sm h-9 text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 rounded-lg border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300" onClick={() => { setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' })); setDatePreset('all'); setShowDateDropdown(false); }}>Clear</Button>
                  <Button className="flex-1 bg-[#D4A853] hover:bg-[#C49A48] rounded-lg text-white" onClick={() => { if (filters.dateFrom && filters.dateTo) setDatePreset('custom'); setShowDateDropdown(false); }}>Apply</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SimpleDropdown>

      {/* Location Dropdown - Filters by Incident Location */}
      <SimpleDropdown
        isOpen={showLocationDropdown}
        onClose={() => setShowLocationDropdown(false)}
        align="right"
        trigger={
          <Button
            variant={filters.locations.length > 0 ? "default" : "outline"}
            className={`gap-2 rounded-xl relative ${filters.locations.length > 0 ? 'bg-[#D4A853] hover:bg-[#C49A48] text-white' : 'border-gray-200 text-gray-700'} dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700`}
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
          >
            <MapPin className="w-4 h-4" />
            Incident Location
            {filters.locations.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {filters.locations.length}
              </span>
            )}
            <ChevronDown className="w-4 h-4" />
          </Button>
        }
      >
        <div className="bg-white p-4 max-h-96 overflow-y-auto rounded-xl min-w-[280px] dark:bg-slate-800">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Filter by Incident Location</Label>
            {filters.locations.length > 0 && (
              <button onClick={() => setFilters(prev => ({ ...prev, locations: [] }))} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Clear all</button>
            )}
          </div>
          <div className="space-y-4">
            {Object.entries(locationLabels).map(([groupName, locations]) => (
              <div key={groupName}>
                <Label className="text-xs font-semibold text-gray-500 mb-2 block dark:text-gray-400">{groupName}</Label>
                <div className="space-y-2 pl-2">
                  {Object.entries(locations).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded dark:hover:bg-slate-700">
                      <input
                        type="checkbox"
                        checked={filters.locations.includes(key)}
                        onChange={() => toggleFilter('locations', key)}
                        className="rounded border-gray-300 dark:border-slate-600 dark:bg-slate-700 text-[#D4A853]"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
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
  );

  const renderActiveFilters = () => (
    <div className="mb-4 flex flex-wrap gap-2">
      {filters.status.map(s => (
        <Badge key={s} variant="secondary" className="gap-1 px-2 py-1 bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600">
          {statusLabels[s]}
          <X className="w-3 h-3 cursor-pointer" onClick={() => toggleFilter('status', s)} />
        </Badge>
      ))}
      {filters.urgency.map(u => (
        <Badge key={u} variant="secondary" className="gap-1 px-2 py-1 bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600">
          {urgencyLabels[u]}
          <X className="w-3 h-3 cursor-pointer" onClick={() => toggleFilter('urgency', u)} />
        </Badge>
      ))}
      {filters.category.map(c => (
        <Badge key={c} variant="secondary" className="gap-1 px-2 py-1 bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600">
          {categoryLabels[c]}
          <X className="w-3 h-3 cursor-pointer" onClick={() => toggleFilter('category', c)} />
        </Badge>
      ))}
      {filters.locations.map(l => {
        // Find the display name for the location
        let displayName = l;
        for (const group of Object.values(locationLabels)) {
          if (group[l]) {
            displayName = group[l];
            break;
          }
        }
        return (
          <Badge key={l} variant="secondary" className="gap-1 px-2 py-1 bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600">
            <MapPin className="w-3 h-3" />
            {displayName}
            <X className="w-3 h-3 cursor-pointer" onClick={() => toggleFilter('locations', l)} />
          </Badge>
        );
      })}
      {(filters.dateFrom || filters.dateTo) && (
        <Badge key="date-range" variant="secondary" className="gap-1 px-2 py-1 bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600">
          <Calendar className="w-3 h-3" />
          {filters.dateFrom && filters.dateTo ? `${filters.dateFrom} to ${filters.dateTo}` : filters.dateFrom ? `From ${filters.dateFrom}` : `To ${filters.dateTo}`}
          <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }))} />
        </Badge>
      )}
    </div>
  );

  const renderReportsTable = () => {
    const sortedReports = getSortedReports();

    const SortIcon = ({ column }) => {
      if (sortConfig.key !== column) return <ChevronDown className="w-3 h-3 opacity-30" />;
      return sortConfig.direction === 'asc'
        ? <ChevronDown className="w-3 h-3" />
        : <ChevronUp className="w-3 h-3" />;
    };

    return (
      <div className="rounded-xl border border-gray-200 overflow-hidden dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-[100px] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => handleSort('reportId')}
                >
                  <div className="flex items-center gap-1">
                    ID <SortIcon column="reportId" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-[180px] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => handleSort('reporterName')}
                >
                  <div className="flex items-center gap-1">
                    Reporter <SortIcon column="reporterName" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-[130px] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center gap-1">
                    Category <SortIcon column="category" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-[200px] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => handleSort('location')}
                >
                  <div className="flex items-center gap-1">
                    Incident Location <SortIcon column="location" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-[110px] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => handleSort('dateTime')}
                >
                  <div className="flex items-center gap-1">
                    Date/Time <SortIcon column="dateTime" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-[100px] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => handleSort('urgency')}
                >
                  <div className="flex items-center gap-1">
                    Urgency <SortIcon column="urgency" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-[110px] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status <SortIcon column="status" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 w-[140px] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => handleSort('officerName')}
                >
                  <div className="flex items-center gap-1">
                    Officer <SortIcon column="officerName" />
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-200 w-[70px]">Actions</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-200 w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 dark:bg-slate-800 dark:divide-slate-700">
              {sortedReports.length > 0 ? (
                sortedReports.map((raw) => {
                  const r = normalise(raw);
                  const hasLocation = r.location && r.location.trim() !== '' && r.location !== 'No address specified';

                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50 cursor-pointer transition-colors group dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-sm font-mono text-[#D4A853] dark:text-amber-500">{r.id}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{r.reporterName}</p>
                        {r.reporterContact && <p className="text-xs text-gray-500 dark:text-gray-400">{r.reporterContact}</p>}
                        {r.reporterEmail && <p className="text-xs text-gray-500 dark:text-gray-400">{r.reporterEmail}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <EditableCell value={r.category} reportId={r.id} field="incidentCategory" options={categoryLabels} optionLabels={categoryLabels} onUpdate={handleCellUpdate} />
                       </td>
                      <td className="px-4 py-3">
                        {hasLocation ? (
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3 h-3 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-gray-600 dark:text-gray-400 break-words line-clamp-2" title={r.location}>
                              {r.location}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                            <span className="text-xs text-gray-400 dark:text-gray-500 italic">No location</span>
                          </div>
                        )}
                       </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 dark:text-gray-200">{r.date}</p>
                        {r.time && <p className="text-xs text-gray-500 dark:text-gray-400">{r.time}</p>}
                       </td>
                      <td className="px-4 py-3">
                        <EditableCell value={r.urgency} reportId={r.id} field="urgency" options={urgencyLabels} optionLabels={urgencyLabels} onUpdate={handleCellUpdate} />
                       </td>
                      <td className="px-4 py-3">
                        <EditableCell value={r.status} reportId={r.id} field="status" options={statusLabels} optionLabels={statusLabels} onUpdate={handleCellUpdate} />
                       </td>
                      <td className="px-4 py-3">
                        <EditableCell value={r.assignedOfficer ? r.officerName : 'Not Assigned'} reportId={r.id} field="assignedOfficer" options={officerOptions} optionLabels={officerOptions} onUpdate={handleOfficerUpdate} />
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
                              <DropdownMenuItem onClick={() => openReportDetails(raw)} className="gap-2 cursor-pointer hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30 dark:hover:text-amber-400">
                                <Eye className="w-4 h-4" /><span>View Details</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { const normalized = normalise(raw); setSelectedReport(normalized); setIsEditingOpen(true); }} className="gap-2 cursor-pointer hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30 dark:hover:text-amber-400">
                                <Edit className="w-4 h-4" /><span>Edit Report</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                       </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30" onClick={(e) => { e.stopPropagation(); handleDeleteReport(raw); }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                       </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No reports found matching your filters</td>
                </tr>
              )}
            </tbody>
           </table>
        </div>
      </div>
    );
  };

  const renderPagination = () => (
    (reports?.total ?? 0) > 0 && (
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {startIndex + 1} to {Math.min(startIndex + (reports?.per_page ?? 10), reports?.total ?? 0)} of {reports?.total ?? 0} reports
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || isLoading} className="rounded-lg border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-1">
              {getPageNumbers().map((page, idx) => page === '...' ? <span key={idx} className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400">...</span> : (
                <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" onClick={() => goToPage(page)} disabled={isLoading} className={`rounded-lg min-w-[36px] ${currentPage === page ? 'bg-[#D4A853] hover:bg-[#C49A48] text-white' : 'border-gray-200 text-gray-700'} dark:border-slate-700 dark:text-gray-300`}>
                  {page}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || isLoading} className="rounded-lg border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    )
  );

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
