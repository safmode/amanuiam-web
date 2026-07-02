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
  ChevronLeft, ChevronRight, Trash2, MoreHorizontal, Eye, Edit, Building, Home, Library, Landmark
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
  nfa: 'No Further Action',
};

export const urgencyLabels = {
  general: 'General',
  urgent: 'Urgent',
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
};

// Helper function to get location area - NOW USES SERVER-DETERMINED VALUE
const getLocationArea = (report) => {
  if (!report) return 'Not specified';

  // PRIORITY 1: Use server-determined location (from proximity matching)
  if (report.determinedLocation && report.determinedLocation !== 'Unknown') {
    // Convert the key to display name
    for (const group of Object.values(locationLabels)) {
      for (const [key, label] of Object.entries(group)) {
        if (key === report.determinedLocation ||
            label === report.determinedLocation ||
            report.determinedLocation.includes(key)) {
          return label;
        }
      }
    }
    return report.determinedLocation;
  }

  // PRIORITY 2: Check location object from server (already processed)
  if (report.locationArea && report.locationArea !== 'Not specified') {
    return report.locationArea;
  }

  // PRIORITY 3: Check location object
  if (report.location && typeof report.location === 'object') {
    if (report.location.locationArea && report.location.locationArea.trim() !== '') {
      const placeNames = ['7 eleven', 'seven eleven', 'office', 'cafe', 'cafeteria', 'library', 'gym', 'store', 'shop', 'restaurant', 'food court'];
      const isPlaceName = placeNames.some(place => report.location.locationArea.toLowerCase().includes(place.toLowerCase()));
      if (!isPlaceName) {
        return report.location.locationArea;
      }
    }
  }

  // Fallback to mahallah field
  if (report.mahallah && report.mahallah.trim() !== '') {
    return report.mahallah;
  }

  return 'Not specified';
};

// Helper function to get specific address (building, room, business name)
const getSpecificAddress = (report) => {
  if (!report) return 'Not specified';

  // PRIORITY: Use server-provided specific address if available
  if (report.specificAddress && report.specificAddress !== 'Not specified') {
    return report.specificAddress;
  }

  // Check location object
  if (report.location && typeof report.location === 'object') {
    // Add specificPlace (business names like "7 Eleven")
    if (report.location.specificPlace && report.location.specificPlace.trim() !== '') {
      return report.location.specificPlace;
    }
    // Add building if exists and no specificPlace
    else if (report.location.building && report.location.building.trim() !== '') {
      return report.location.building;
    }

    // IF NOTHING ELSE, EXTRACT FROM ADDRESS!
    if (report.location.address && report.location.address.trim() !== '') {
      let address = report.location.address;
      // Remove known location names from the address
      const locationNames = ['Mahallah Asiah', 'Mahallah Aminah', 'Mahallah Safiyyah', 'Mahallah Maryam',
        'Mahallah Ruqayyah', 'Mahallah Ali', 'Mahallah Faruq', 'Mahallah Bilal', 'Mahallah Asma',
        'Mahallah Hafsah', 'Mahallah Halimah', 'Mahallah Siddiq', 'Mahallah Salahuddin', 'Mahallah Uthman',
        'Mahallah Nusaibah', 'Mahallah Zubair', 'Mahallah Sumayyah', 'KIRKHS', 'KICT', 'KOE', 'KAED', 'KENMS', 'AIKOL', 'KOED'];

      for (const name of locationNames) {
        address = address.replace(new RegExp(name, 'gi'), '');
      }
      address = address.replace(/Mahallah /gi, '');
      address = address.replace(/Kulliyyah /gi, '');
      address = address.trim();
      address = address.replace(/\s+/g, ' ');
      address = address.replace(/,$/, '');

      if (address && address !== '') {
        return address;
      }
    }
  }

  // Fallback to building field
  if (report.building && report.building.trim() !== '') {
    return report.building;
  }

  // Fallback to address
  if (report.address && report.address.trim() !== '') {
    return report.address;
  }

  return 'Not specified';
};

// Get icon for location area type
const getLocationIcon = (locationArea) => {
  if (!locationArea || locationArea === 'Not specified') return <MapPin className="w-3 h-3 text-gray-400" />;

  const areaLower = locationArea.toLowerCase();

  if (areaLower.includes('mahallah')) return <Home className="w-3 h-3 text-amber-600 dark:text-amber-400" />;
  if (areaLower.includes('kirkhs') || areaLower.includes('kict') || areaLower.includes('koe') ||
      areaLower.includes('kaed') || areaLower.includes('kenms') || areaLower.includes('aikol') ||
      areaLower.includes('koed')) return <Landmark className="w-3 h-3 text-blue-600 dark:text-blue-400" />;
  if (areaLower.includes('library')) return <Library className="w-3 h-3 text-purple-600 dark:text-purple-400" />;
  if (areaLower.includes('stadium')) return <Landmark className="w-3 h-3 text-green-600 dark:text-green-400" />;
  if (areaLower.includes('mosque')) return <Landmark className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />;

  return <Building className="w-3 h-3 text-gray-600 dark:text-gray-400" />;
};

// Helper function to format location name for display
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
  const { reports = { data: [], total: 0, current_page: 1, last_page: 1, per_page: 10 }, statusCounts: initialStatusCounts = { pending: 0, inProgress: 0, resolved: 0, nfa: 0 }, filters: serverFilters = {} } = usePage().props;

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
      // Use server-determined location if available
      locationArea: r.determinedLocation ? formatLocationName(r.determinedLocation) : getLocationArea(r),
      specificAddress: getSpecificAddress(r),
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
      const options = {
        'Not Assigned': 'Not Assigned'
      };
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

    const headers = ['Report ID', 'Student Name', 'Student Email', 'Student Phone', 'Category', 'Location Area', 'Specific Address', 'Date', 'Time', 'Urgency', 'Status', 'Assigned Officer', 'Description'];

    const csvData = allReports.map(r => {
      const escapeCSV = (str) => {
        if (!str) return '';
        if (typeof str !== 'string') str = String(str);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) return `"${str.replace(/"/g, '""')}"`;
        return str;
      };

      // Get location area
      let locationArea = '';
      if (r.determinedLocation) {
        // Convert key to display name
        for (const group of Object.values(locationLabels)) {
          for (const [key, label] of Object.entries(group)) {
            if (key === r.determinedLocation || label === r.determinedLocation || r.determinedLocation.includes(key)) {
              locationArea = label;
              break;
            }
          }
        }
        if (!locationArea) locationArea = r.determinedLocation;
      } else if (r.locationArea && r.locationArea !== 'Not specified') {
        locationArea = r.locationArea;
      } else if (r.location?.locationArea) {
        locationArea = r.location.locationArea;
      } else if (r.mahallah) {
        locationArea = r.mahallah;
      } else {
        locationArea = 'Not specified';
      }

      // Get specific address - PRIORITIZE extraction from location object
      let specificAddress = '';

      // Check location object first
      if (r.location && typeof r.location === 'object') {
        // Priority 1: specificPlace
        if (r.location.specificPlace && r.location.specificPlace.trim() !== '') {
          specificAddress = r.location.specificPlace;
        }
        // Priority 2: building
        else if (r.location.building && r.location.building.trim() !== '') {
          specificAddress = r.location.building;
        }
        // Priority 3: extract from address
        else if (r.location.address && r.location.address.trim() !== '') {
          let address = r.location.address;
          // Remove all known location names
          const locationNames = ['Mahallah Asiah', 'Mahallah Aminah', 'Mahallah Safiyyah', 'Mahallah Maryam',
            'Mahallah Ruqayyah', 'Mahallah Ali', 'Mahallah Faruq', 'Mahallah Bilal', 'Mahallah Asma',
            'Mahallah Hafsah', 'Mahallah Halimah', 'Mahallah Siddiq', 'Mahallah Salahuddin', 'Mahallah Uthman',
            'Mahallah Nusaibah', 'Mahallah Zubair', 'Mahallah Sumayyah', 'KIRKHS (AHAS KIRKHS)', 'KICT (ICT)',
            'KOE (Engineering)', 'KAED (Architecture)', 'KENMS (Economics)', 'AIKOL (Law)', 'KOED (Education)',
            'Dar al-Hikmah Library', 'Female Sports Complex', 'Saidina Hamzah Stadium', 'IIUM Archery Range',
            'UIA Football Turf', 'IIUM Cricket Ground', 'IIUM Rugby Field', 'Padang Kawad UIAM',
            'IIUM Educare', 'Sultan Haji Ahmad Shah Mosque'];

          for (const name of locationNames) {
            address = address.replace(new RegExp(name, 'gi'), '');
          }
          address = address.replace(/Mahallah /gi, '');
          address = address.replace(/Kulliyyah /gi, '');
          address = address.trim();
          address = address.replace(/\s+/g, ' ');
          address = address.replace(/,$/, '');
          address = address.replace(/^,/, '');

          if (address && address !== '') {
            specificAddress = address;
          }
        }
      }

      // Fallback to direct fields
      if (!specificAddress && r.specificAddress && r.specificAddress !== 'Not specified') {
        specificAddress = r.specificAddress;
      }
      if (!specificAddress && r.building) {
        specificAddress = r.building;
      }
      if (!specificAddress && r.address) {
        specificAddress = r.address;
      }

      if (!specificAddress) {
        specificAddress = 'Not specified';
      }

      return [
        escapeCSV(r.reportId),
        escapeCSV(r.studentName || '—'),
        escapeCSV(r.studentEmail || '—'),
        escapeCSV(r.studentPhone || '—'),
        escapeCSV(categoryLabels[r.incidentCategory] || r.incidentCategory || '—'),
        escapeCSV(locationArea),
        escapeCSV(specificAddress),
        r.incidentDateTime ? new Date(r.incidentDateTime).toLocaleDateString('en-MY') : '—',
        r.incidentDateTime ? new Date(r.incidentDateTime).toLocaleTimeString('en-MY') : '—',
        escapeCSV(urgencyLabels[r.urgency] || r.urgency || '—'),
        escapeCSV(statusLabels[r.status] || r.status || '—'),
        escapeCSV(r.assignedOfficer || '—'),
        escapeCSV(r.description || '—')
      ];
    });

    const BOM = "\uFEFF";
    const csvContent = BOM + [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports_${new Date().toISOString().split('T')[0]}.csv`;
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
        case 'locationArea':
          aVal = a.determinedLocation ? formatLocationName(a.determinedLocation) : getLocationArea(a);
          bVal = b.determinedLocation ? formatLocationName(b.determinedLocation) : getLocationArea(b);
          break;
        case 'specificAddress':
          aVal = getSpecificAddress(a);
          bVal = getSpecificAddress(b);
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
          const statusOrder = { pending: 1, inProgress: 2, resolved: 3, nfa: 4 };
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
            } else if (field === 'assignedOfficer') {
            updated.assignedOfficer = newValue === 'Not Assigned' ? null : newValue;
            const officer = officersList.find(o => o.officerId === newValue);
            updated.officerName = officer?.officerName || 'Not Assigned';
            }

            return updated;
        }
        return report;
        })
    );

    // 🔥 FIX: Send the update with the report's current location data
    const report = localReports.find(r => r.reportId === reportId);
    if (report) {
        const updateData = {
        [field]: field === 'assignedOfficer' ? (newValue === 'Not Assigned' ? null : newValue) : newValue
        };

        // 🔥 Preserve location data if it exists
        if (report.location) {
        updateData.location = report.location;
        }
        if (report.mahallah) {
        updateData.mahallah = report.mahallah;
        }
        if (report.specificAddress) {
        updateData.specificAddress = report.specificAddress;
        }

        router.put(`/Reports/${reportId}`, updateData, {
        preserveScroll: true,
        preserveState: true,
        onError: (errors) => {
            // Revert changes on error
            handleCellUpdate(reportId, field, oldValue, newValue);
            showToast('Failed to update: ' + JSON.stringify(errors), 'error');
        }
        });
    }
    };

  const handleOfficerUpdate = (reportId, field, newValue, oldValue) => {
    let officerName = 'Not Assigned';
    if (newValue && newValue !== 'Not Assigned') {
      const selectedOfficer = officersList.find(o => o.officerId === newValue);
      officerName = selectedOfficer?.officerName || 'Not Assigned';
    }

    setLocalReports(prevReports =>
      prevReports.map(report => {
        if (report.reportId === reportId) {
          return {
            ...report,
            assignedOfficer: newValue === 'Not Assigned' ? null : newValue,
            officerName: officerName
          };
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Card className="bg-[#F6EBCA] border-[#D5A642] dark:bg-amber-900/20 dark:border-amber-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{localStatusCounts?.pending ?? 0}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#D5A642] dark:bg-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-[#DAEEFE] border-[#60A8FA] dark:bg-blue-900/20 dark:border-blue-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-[#60A8FA] dark:text-blue-400">{localStatusCounts?.inProgress ?? 0}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">In Progress</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#60A8FA] dark:bg-blue-600 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-[#CFE7C4] border-[#41A52B] dark:bg-green-900/20 dark:border-green-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{localStatusCounts?.resolved ?? 0}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Resolved</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#41A52B] dark:bg-green-700 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFilterBar = () => (
    <div className="flex flex-wrap gap-3 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <Input
          placeholder="Search reports by ID, description, location..."
          className="pl-10 bg-gray-50 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <SimpleDropdown isOpen={showFilterDropdown} onClose={() => setShowFilterDropdown(false)} align="left"
        trigger={
          <Button variant={getFilterCount() > 0 ? "default" : "outline"}
            className={`gap-2 rounded-xl relative ${getFilterCount() > 0 ? 'bg-[#D4A853] hover:bg-[#C49A48] text-white' : 'border-gray-200 text-gray-700'} dark:bg-slate-800 dark:text-gray-300`}
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}>
            <Filter className="w-4 h-4" /> Filters {getFilterCount() > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{getFilterCount()}</span>} <ChevronDown className="w-4 h-4" />
          </Button>
        }>
        <div className="bg-white p-4 max-h-96 overflow-y-auto rounded-xl min-w-[280px] dark:bg-slate-800">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2"><Label className="text-sm font-medium">Status</Label>{filters.status.length > 0 && <button onClick={() => setFilters(prev => ({ ...prev, status: [] }))} className="text-xs text-red-500">Clear</button>}</div>
              <div className="space-y-2">{Object.entries(statusLabels).map(([key, label]) => (<label key={key} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={filters.status.includes(key)} onChange={() => toggleFilter('status', key)} className="rounded" /><span className="text-sm">{label}</span></label>))}</div>
            </div>
            <div className="border-t border-gray-200" />
            <div>
              <div className="flex items-center justify-between mb-2"><Label className="text-sm font-medium">Urgency</Label>{filters.urgency.length > 0 && <button onClick={() => setFilters(prev => ({ ...prev, urgency: [] }))} className="text-xs text-red-500">Clear</button>}</div>
              <div className="space-y-2">{Object.entries(urgencyLabels).map(([key, label]) => (<label key={key} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={filters.urgency.includes(key)} onChange={() => toggleFilter('urgency', key)} className="rounded" /><span className="text-sm">{label}</span></label>))}</div>
            </div>
            <div className="border-t border-gray-200" />
            <div>
              <div className="flex items-center justify-between mb-2"><Label className="text-sm font-medium">Category</Label>{filters.category.length > 0 && <button onClick={() => setFilters(prev => ({ ...prev, category: [] }))} className="text-xs text-red-500">Clear</button>}</div>
              <div className="space-y-2">{Object.entries(categoryLabels).map(([key, label]) => (<label key={key} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={filters.category.includes(key)} onChange={() => toggleFilter('category', key)} className="rounded" /><span className="text-sm truncate">{label}</span></label>))}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t"><Button variant="ghost" size="sm" onClick={() => { setFilters(prev => ({ ...prev, status: [], urgency: [], category: [] })); setShowFilterDropdown(false); }} className="w-full text-red-600">Clear All Filters</Button></div>
        </div>
      </SimpleDropdown>

      <SimpleDropdown isOpen={showDateDropdown} onClose={() => setShowDateDropdown(false)} align="right"
        trigger={
          <Button variant={(filters.dateFrom || filters.dateTo) ? "default" : "outline"}
            className={`gap-2 rounded-xl ${(filters.dateFrom || filters.dateTo) ? 'bg-[#D4A853] text-white' : 'border-gray-200 text-gray-700'} dark:bg-slate-800 dark:text-gray-300`}
            onClick={() => setShowDateDropdown(!showDateDropdown)}>
            <Calendar className="w-4 h-4" /> {getDateFilterLabel()} <ChevronDown className="w-4 h-4" />
          </Button>
        }>
        <div className="bg-white p-4 rounded-xl min-w-[260px] dark:bg-slate-800">
          <div className="space-y-4">
            <div><div className="flex items-center justify-between mb-2"><Label>Time Period</Label>{(filters.dateFrom || filters.dateTo) && <button onClick={() => { setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' })); setDatePreset('all'); setShowDateDropdown(false); }} className="text-xs text-red-500">Clear</button>}</div>
            <div className="space-y-2">
              <button onClick={() => { const today = new Date(); const dateStr = today.toISOString().split('T')[0]; setFilters(prev => ({ ...prev, dateFrom: dateStr, dateTo: dateStr })); setDatePreset('today'); setShowDateDropdown(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${datePreset === 'today' ? 'bg-[#D4A853] text-white' : 'hover:bg-gray-100'}`}>Today</button>
              <button onClick={() => { const today = new Date(); const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay()); const endOfWeek = new Date(today); endOfWeek.setDate(today.getDate() + (6 - today.getDay())); setFilters(prev => ({ ...prev, dateFrom: startOfWeek.toISOString().split('T')[0], dateTo: endOfWeek.toISOString().split('T')[0] })); setDatePreset('week'); setShowDateDropdown(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${datePreset === 'week' ? 'bg-[#D4A853] text-white' : 'hover:bg-gray-100'}`}>This Week</button>
              <button onClick={() => { const today = new Date(); const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); setFilters(prev => ({ ...prev, dateFrom: startOfMonth.toISOString().split('T')[0], dateTo: endOfMonth.toISOString().split('T')[0] })); setDatePreset('month'); setShowDateDropdown(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${datePreset === 'month' ? 'bg-[#D4A853] text-white' : 'hover:bg-gray-100'}`}>This Month</button>
              <button onClick={() => { setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' })); setDatePreset('all'); setShowDateDropdown(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${datePreset === 'all' ? 'bg-[#D4A853] text-white' : 'hover:bg-gray-100'}`}>All Time</button>
            </div></div>
            <div className="border-t" />
            <div><Label className="text-sm font-medium mb-2 block">Custom Range</Label>
            <div className="space-y-3">
              <div><Label className="text-xs text-gray-500 mb-1 block">From</Label><Input type="date" value={filters.dateFrom} onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))} className="bg-gray-50 rounded-lg text-sm h-9" /></div>
              <div><Label className="text-xs text-gray-500 mb-1 block">To</Label><Input type="date" value={filters.dateTo} onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))} className="bg-gray-50 rounded-lg text-sm h-9" /></div>
              <div className="flex gap-2 pt-2"><Button variant="outline" className="flex-1" onClick={() => { setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' })); setDatePreset('all'); setShowDateDropdown(false); }}>Clear</Button><Button className="flex-1 bg-[#D4A853] hover:bg-[#C49A48] text-white" onClick={() => { if (filters.dateFrom && filters.dateTo) setDatePreset('custom'); setShowDateDropdown(false); }}>Apply</Button></div>
            </div></div>
          </div>
        </div>
      </SimpleDropdown>

      <SimpleDropdown isOpen={showLocationDropdown} onClose={() => setShowLocationDropdown(false)} align="right"
        trigger={
          <Button variant={filters.locations.length > 0 ? "default" : "outline"}
            className={`gap-2 rounded-xl relative ${filters.locations.length > 0 ? 'bg-[#D4A853] text-white' : 'border-gray-200 text-gray-700'} dark:bg-slate-800 dark:text-gray-300`}
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}>
            <MapPin className="w-4 h-4" /> Location Area {filters.locations.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{filters.locations.length}</span>} <ChevronDown className="w-4 h-4" />
          </Button>
        }>
        <div className="bg-white p-4 max-h-96 overflow-y-auto rounded-xl min-w-[280px] dark:bg-slate-800">
          <div className="flex items-center justify-between mb-3"><Label className="text-sm font-medium">Filter by Location Area</Label>{filters.locations.length > 0 && <button onClick={() => setFilters(prev => ({ ...prev, locations: [] }))} className="text-xs text-red-500">Clear all</button>}</div>
          <div className="space-y-4">{Object.entries(locationLabels).map(([groupName, locations]) => (<div key={groupName}><Label className="text-xs font-semibold text-gray-500 mb-2 block">{groupName}</Label><div className="space-y-2 pl-2">{Object.entries(locations).map(([key, label]) => (<label key={key} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={filters.locations.includes(key)} onChange={() => toggleFilter('locations', key)} className="rounded" /><span className="text-sm">{label}</span></label>))}</div></div>))}</div>
        </div>
      </SimpleDropdown>

      {hasActiveFilters && <Button variant="ghost" className="gap-2 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50" onClick={clearAllFilters}><X className="w-4 h-4" />Clear All</Button>}
    </div>
  );

  const renderActiveFilters = () => (
    <div className="mb-4 flex flex-wrap gap-2">
      {filters.status.map(s => <Badge key={s} className="gap-1 px-2 py-1 bg-gray-100"><span>{statusLabels[s]}</span><X className="w-3 h-3 cursor-pointer" onClick={() => toggleFilter('status', s)} /></Badge>)}
      {filters.urgency.map(u => <Badge key={u} className="gap-1 px-2 py-1 bg-gray-100"><span>{urgencyLabels[u]}</span><X className="w-3 h-3 cursor-pointer" onClick={() => toggleFilter('urgency', u)} /></Badge>)}
      {filters.category.map(c => <Badge key={c} className="gap-1 px-2 py-1 bg-gray-100"><span>{categoryLabels[c]}</span><X className="w-3 h-3 cursor-pointer" onClick={() => toggleFilter('category', c)} /></Badge>)}
      {filters.locations.map(l => { let displayName = l; for (const group of Object.values(locationLabels)) { if (group[l]) { displayName = group[l]; break; } } return <Badge key={l} className="gap-1 px-2 py-1 bg-gray-100"><MapPin className="w-3 h-3" /><span>{displayName}</span><X className="w-3 h-3 cursor-pointer" onClick={() => toggleFilter('locations', l)} /></Badge>; })}
      {(filters.dateFrom || filters.dateTo) && <Badge className="gap-1 px-2 py-1 bg-gray-100"><Calendar className="w-3 h-3" /><span>{filters.dateFrom && filters.dateTo ? `${filters.dateFrom} to ${filters.dateTo}` : filters.dateFrom ? `From ${filters.dateFrom}` : `To ${filters.dateTo}`}</span><X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }))} /></Badge>}
    </div>
  );

  const renderReportsTable = () => {
    const sortedReports = getSortedReports();
    const SortIcon = ({ column }) => sortConfig.key !== column ? <ChevronDown className="w-3 h-3 opacity-30" /> : (sortConfig.direction === 'asc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />);
    const officerSelectOptions = { ...officerOptions, 'Not Assigned': 'Not Assigned' };

    return (
      <div className="rounded-xl border border-gray-200 overflow-hidden dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium w-[100px] cursor-pointer hover:bg-gray-100" onClick={() => handleSort('reportId')}><div className="flex items-center gap-1">ID <SortIcon column="reportId" /></div></th>
                <th className="px-4 py-3 text-left text-sm font-medium w-[180px] cursor-pointer hover:bg-gray-100" onClick={() => handleSort('reporterName')}><div className="flex items-center gap-1">Reporter <SortIcon column="reporterName" /></div></th>
                <th className="px-4 py-3 text-left text-sm font-medium w-[130px] cursor-pointer hover:bg-gray-100" onClick={() => handleSort('category')}><div className="flex items-center gap-1">Category <SortIcon column="category" /></div></th>
                <th className="px-4 py-3 text-left text-sm font-medium w-[180px] cursor-pointer hover:bg-gray-100" onClick={() => handleSort('locationArea')}><div className="flex items-center gap-1">Location Area <SortIcon column="locationArea" /></div></th>
                <th className="px-4 py-3 text-left text-sm font-medium w-[180px] cursor-pointer hover:bg-gray-100" onClick={() => handleSort('specificAddress')}><div className="flex items-center gap-1">Specific Address <SortIcon column="specificAddress" /></div></th>
                <th className="px-4 py-3 text-left text-sm font-medium w-[110px] cursor-pointer hover:bg-gray-100" onClick={() => handleSort('dateTime')}><div className="flex items-center gap-1">Date/Time <SortIcon column="dateTime" /></div></th>
                <th className="px-4 py-3 text-left text-sm font-medium w-[100px] cursor-pointer hover:bg-gray-100" onClick={() => handleSort('urgency')}><div className="flex items-center gap-1">Urgency <SortIcon column="urgency" /></div></th>
                <th className="px-4 py-3 text-left text-sm font-medium w-[110px] cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}><div className="flex items-center gap-1">Status <SortIcon column="status" /></div></th>
                <th className="px-4 py-3 text-left text-sm font-medium w-[140px] cursor-pointer hover:bg-gray-100" onClick={() => handleSort('officerName')}><div className="flex items-center gap-1">Officer <SortIcon column="officerName" /></div></th>
                <th className="px-4 py-3 text-center text-sm font-medium w-[70px]">Actions</th>
                <th className="px-4 py-3 text-center text-sm font-medium w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 dark:bg-slate-800">
              {sortedReports.length > 0 ? sortedReports.map((raw) => {
                const r = normalise(raw);
                const hasLocationArea = r.locationArea && r.locationArea !== 'Not specified';
                const hasSpecificAddress = r.specificAddress && r.specificAddress !== 'Not specified';
                const locationIcon = getLocationIcon(r.locationArea);

                return (
                  <tr key={r.id} className="hover:bg-gray-50/50 cursor-pointer transition-colors group dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-sm font-mono text-[#D4A853]">{r.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{r.reporterName}</p>
                      {r.reporterContact && <p className="text-xs text-gray-500">{r.reporterContact}</p>}
                      {r.reporterEmail && <p className="text-xs text-gray-500">{r.reporterEmail}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm"><EditableCell value={r.category} reportId={r.id} field="incidentCategory" options={categoryLabels} optionLabels={categoryLabels} onUpdate={handleCellUpdate} /></td>
                    <td className="px-4 py-3">
                      {hasLocationArea ? (
                        <div className="flex items-center gap-1.5">
                          {locationIcon}
                          <span className="text-sm text-gray-700 dark:text-gray-300">{r.locationArea}</span>
                        </div>
                      ) : <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-gray-300" /><span className="text-xs text-gray-400 italic">Not specified</span></div>}
                    </td>
                    <td className="px-4 py-3">
                      {hasSpecificAddress ? (
                        <div className="flex items-start gap-1.5">
                          <Building className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-gray-600 break-words line-clamp-2" title={r.specificAddress}>{r.specificAddress}</span>
                        </div>
                      ) : <div className="flex items-center gap-1.5"><Building className="w-3 h-3 text-gray-300" /><span className="text-xs text-gray-400 italic">Not specified</span></div>}
                    </td>
                    <td className="px-4 py-3"><p className="text-sm text-gray-900">{r.date}</p>{r.time && <p className="text-xs text-gray-500">{r.time}</p>}</td>
                    <td className="px-4 py-3"><EditableCell value={r.urgency} reportId={r.id} field="urgency" options={urgencyLabels} optionLabels={urgencyLabels} onUpdate={handleCellUpdate} /></td>
                    <td className="px-4 py-3"><EditableCell value={r.status} reportId={r.id} field="status" options={statusLabels} optionLabels={statusLabels} onUpdate={handleCellUpdate} /></td>
                    <td className="px-4 py-3"><EditableCell value={r.assignedOfficer || 'Not Assigned'} reportId={r.id} field="assignedOfficer" options={officerSelectOptions} optionLabels={officerSelectOptions} onUpdate={handleOfficerUpdate} placeholder="Not Assigned" /></td>
                    <td className="px-4 py-3 text-center">
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreHorizontal className="w-4 h-4 text-gray-500" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl min-w-[160px]">
                            <DropdownMenuItem onClick={() => openReportDetails(raw)} className="gap-2 cursor-pointer"><Eye className="w-4 h-4" /><span>View Details</span></DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { const normalized = normalise(raw); setSelectedReport(normalized); setIsEditingOpen(true); }} className="gap-2 cursor-pointer"><Edit className="w-4 h-4" /><span>Edit Report</span></DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Button variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDeleteReport(raw); }}><Trash2 className="w-3 h-3" /></Button></td>
                  </tr>
                );
              }) : <tr><td colSpan="11" className="px-4 py-8 text-center text-sm text-gray-500">No reports found matching your filters</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPagination = () => (reports?.total ?? 0) > 0 && (
    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-sm text-gray-600">Showing {startIndex + 1} to {Math.min(startIndex + (reports?.per_page ?? 10), reports?.total ?? 0)} of {reports?.total ?? 0} reports</p>
      {totalPages > 1 && <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || isLoading}><ChevronLeft className="w-4 h-4" /></Button>
        <div className="flex gap-1">{getPageNumbers().map((page, idx) => page === '...' ? <span key={idx} className="px-3 py-1 text-sm">...</span> : <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" onClick={() => goToPage(page)} disabled={isLoading} className={`min-w-[36px] ${currentPage === page ? 'bg-[#D4A853] text-white' : ''}`}>{page}</Button>)}</div>
        <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || isLoading}><ChevronRight className="w-4 h-4" /></Button>
      </div>}
    </div>
  );

  return (
    <DashboardLayout title="Reports Management" subtitle="View and manage all incident reports">
      {isLoading && <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"><div className="bg-white rounded-lg p-4 shadow-lg"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A853]"></div></div></div>}
      {renderStatsCards()}
      <Card className="bg-white rounded-2xl shadow-sm dark:bg-slate-800">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">All Reports</h3>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 rounded-xl" onClick={handleManualRefresh} disabled={isLoading}><RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /></Button>
              <Button variant="outline" className="gap-2 rounded-xl" onClick={handleExportCSV} disabled={localReports.length === 0}><Download className="w-4 h-4" />Export CSV</Button>
              <Button className="gap-2 bg-[#D4A853] hover:bg-[#C49A48] text-white rounded-xl" onClick={() => setIsAddReportOpen(true)}><Plus className="w-4 h-4" />Add Report</Button>
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
