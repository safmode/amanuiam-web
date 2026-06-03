import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { createPortal } from 'react-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, Calendar, MapPin, FileText, User, AlertCircle, Image, MessageSquare, Edit, X, Loader2, Mail, Phone, Building2 } from 'lucide-react';
import { categoryLabels, statusLabels, urgencyLabels, locationLabels } from '@/Pages/Reports';
import { ReportsEditing } from '@/components/dashboard/ReportsEditing';

// ============================================
// FALLBACK FUNCTIONS
// ============================================

// Fallback formatLocationName function
const formatLocationName = (location) => {
  if (!location) return '';
  for (const group of Object.values(locationLabels)) {
    for (const [key, label] of Object.entries(group)) {
      if (key === location || label === location) return label;
    }
  }
  return location;
};

export const ReportDetailsModal = ({ report, isOpen, onClose, onReportUpdated }) => {
  const [isEditingOpen, setIsEditingOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [localReport, setLocalReport] = useState(report);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    setLocalReport(report);
  }, [report]);

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
      inProgress: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
      resolved: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    };
    return <Badge className={`${styles[status]} text-xs border`}>{statusLabels[status]}</Badge>;
  };

  const getUrgencyBadge = (urgency) => {
    const styles = {
      general: 'border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
      urgent: 'border-red-300 text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    };
    return <Badge variant="outline" className={`${styles[urgency] || styles.general} text-xs`}>{urgencyLabels[urgency]}</Badge>;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return { date: '—', time: '—' };
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-MY'),
      time: date.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getLocationAreaName = (mahallahKey) => {
    if (!mahallahKey) return '—';
    for (const group of Object.values(locationLabels)) {
      if (group[mahallahKey]) {
        return group[mahallahKey];
      }
    }
    return mahallahKey;
  };

  // Helper function to extract specific place from address
  const extractSpecificPlace = (address, locationArea) => {
    if (!address) return null;

    let result = address;

    // Remove location area if present
    if (locationArea) {
      result = result.replace(new RegExp(locationArea, 'gi'), '');
    }

    // Remove known location names
    const locationNames = [
      'Mahallah Asiah', 'Mahallah Aminah', 'Mahallah Safiyyah', 'Mahallah Maryam',
      'Mahallah Ruqayyah', 'Mahallah Ali', 'Mahallah Faruq', 'Mahallah Bilal',
      'Mahallah Asma', 'Mahallah Hafsah', 'Mahallah Halimah', 'Mahallah Siddiq',
      'Mahallah Salahuddin', 'Mahallah Uthman', 'Mahallah Nusaibah', 'Mahallah Zubair',
      'Mahallah Sumayyah', 'KIRKHS (AHAS KIRKHS)', 'KICT (ICT)', 'KOE (Engineering)',
      'KAED (Architecture)', 'KENMS (Economics)', 'AIKOL (Law)', 'KOED (Education)'
    ];

    for (const name of locationNames) {
      result = result.replace(new RegExp(name, 'gi'), '');
    }

    result = result.replace(/Mahallah /gi, '');
    result = result.replace(/Kulliyyah /gi, '');
    result = result.trim();
    result = result.replace(/\s+/g, ' ');
    result = result.replace(/,$/, '');
    result = result.replace(/^,/, '');

    return result || null;
  };

  // Updated function to get incident location with proper extraction
  const getIncidentLocation = (reportData) => {
    if (!reportData) return 'No address specified';

    console.log('Getting location for report:', reportData.reportId || reportData.id);

    // Priority 1: Check if we have specificPlace directly
    if (reportData.specificAddress && reportData.specificAddress !== 'Not specified') {
      return reportData.specificAddress;
    }

    if (reportData.location?.specificPlace) {
      return reportData.location.specificPlace;
    }

    // Priority 2: Check building
    if (reportData.location?.building) {
      return reportData.location.building;
    }
    if (reportData.building) {
      return reportData.building;
    }

    // Priority 3: Extract from address
    let address = null;
    let locationArea = null;

    // Get address from various sources
    if (reportData.location?.address) {
      address = reportData.location.address;
    } else if (reportData.address) {
      address = reportData.address;
    } else if (reportData.locationRaw?.address) {
      address = reportData.locationRaw.address;
    }

    // Get location area
    if (reportData.location?.locationArea) {
      locationArea = reportData.location.locationArea;
    } else if (reportData.locationArea && reportData.locationArea !== 'Not specified') {
      locationArea = reportData.locationArea;
    } else if (reportData.mahallah && reportData.mahallah !== 'Unknown Location') {
      locationArea = reportData.mahallah;
    } else if (reportData.determinedLocation) {
      locationArea = formatLocationName(reportData.determinedLocation);
    }

    if (address) {
      const extracted = extractSpecificPlace(address, locationArea);
      if (extracted) {
        return extracted;
      }
      return address;
    }

    // Priority 4: Check incidentLocation from backend
    if (reportData.incidentLocation && reportData.incidentLocation !== 'No address specified') {
      return reportData.incidentLocation;
    }

    return 'No address specified';
  };

  const resolveUrl = (url) => {
    if (!url) return '#';

    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    if (url.startsWith('blob:') || url.startsWith('data:')) {
        return url;
    }

    const cleaned = url
        .replace(/^\/+/, '')
        .replace(/^storage\//, '')
        .replace(/^public\//, '');
    return `/storage/${cleaned}`;
  };

  const isImage = (url) => {
    const resolved = resolveUrl(url);
    return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(resolved.split('?')[0]) ||
           resolved.includes('cloudinary.com') && !resolved.includes('.pdf');
  };

  const getOptimizedImageUrl = (url) => {
    if (!url) return '#';

    if (url.includes('cloudinary.com')) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}w=400&h=400&c=fill&q=auto&f=auto`;
    }

    return resolveUrl(url);
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm animate-in slide-in-from-bottom-2 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleSaveChanges = (editedReport) => {
    if (!localReport) return;
    setIsEditingOpen(false);
    showToast('Report updated successfully', 'success');
    onClose();
    router.reload({ only: ['reports'] });
  };

  const handleMarkResolved = () => {
    if (!localReport) return;

    setIsResolving(true);

    const reportId = localReport.reportId || localReport.id;
    const oldStatus = localReport.status;
    const payload = { status: 'resolved' };

    const updatedReport = {
      ...localReport,
      status: 'resolved',
      oldStatus: oldStatus,
      _raw: {
        ...localReport._raw,
        status: 'resolved'
      }
    };

    router.put(`/reports/${reportId}`, payload, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        setLocalReport(updatedReport);
        if (onReportUpdated) {
          onReportUpdated(updatedReport);
        }
        showToast('Report marked as resolved', 'success');
        onClose();
        router.reload({ only: ['reports'] });
      },
      onError: (error) => {
        console.error('Failed to mark as resolved:', error);
        showToast('Failed to mark as resolved', 'error');
      },
      onFinish: () => {
        setIsResolving(false);
      }
    });
  };

  if (!localReport) return null;

  const rawReport = localReport._raw || localReport;
  const { date, time } = formatDateTime(rawReport.incidentDateTime || localReport.incidentDateTime);

  // Get the specific address (not the full location)
  const specificAddress = getIncidentLocation(localReport);

  // Get the location area separately for display
  let locationAreaDisplay = '';
  if (rawReport.determinedLocation) {
    locationAreaDisplay = formatLocationName(rawReport.determinedLocation);
  } else if (rawReport.location?.locationArea) {
    locationAreaDisplay = rawReport.location.locationArea;
  } else if (rawReport.locationArea && rawReport.locationArea !== 'Not specified') {
    locationAreaDisplay = rawReport.locationArea;
  } else if (rawReport.mahallah) {
    locationAreaDisplay = rawReport.mahallah;
  }

  // Get reporter's residence (mahallah) if available
  const reporterResidence = localReport.mahallah || rawReport.mahallah || '';

  const attachmentUrls = (() => {
    const raw = rawReport.attachmentUrls || localReport.attachmentUrls;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    try { return JSON.parse(raw).filter(Boolean); } catch { return []; }
  })();

  const lightbox = lightboxUrl
    ? createPortal(
        <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-4"
            style={{ zIndex: 99999 }}
            onClick={() => setLightboxUrl(null)}
        >
            <img
            src={lightboxUrl.includes('cloudinary.com')
                ? `${lightboxUrl.split('?')[0]}?w=1200&h=1200&c=limit&q=auto&f=auto`
                : lightboxUrl}
            alt="Attachment preview"
            className="max-w-full max-h-[90vh] rounded-xl object-contain"
            />
            <button
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
            onClick={() => setLightboxUrl(null)}
            >
            <X className="w-6 h-6" />
            </button>
        </div>,
        document.body
        )
  : null;

  const handleDialogOpenChange = (open) => {
    if (!open && lightboxUrl) {
      setLightboxUrl(null);
      return;
    }
    if (!open) onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !isEditingOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto rounded-2xl p-0 bg-white dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader className="p-6 pb-4 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center dark:bg-amber-900/20">
                <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Report {rawReport.reportId || localReport.reportId || rawReport.id || localReport.id}
              </DialogTitle>
            </div>
            <div className="flex gap-2 mt-3">
              {getUrgencyBadge(rawReport.urgency || localReport.urgency)}
              {getStatusBadge(rawReport.status || localReport.status)}
            </div>
          </DialogHeader>

          <div className="p-6 space-y-5">
            {/* Reporter Information */}
            <Card className="border-gray-200 bg-white dark:bg-slate-800/50 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center dark:bg-amber-900/20">
                    <User className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reporter Information</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-500 mt-0.5 dark:text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Full Name</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {localReport.studentName || localReport.reporterName || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-gray-500 mt-0.5 dark:text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email Address</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-all">
                        {localReport.studentEmail || localReport.reporterEmail || '—'}
                      </p>
                    </div>
                  </div>
                  {localReport.studentMatrix && (
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 text-gray-500 mt-0.5 flex items-center justify-center dark:text-gray-400">
                        <span className="text-xs font-bold">#</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Matrix Number</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 font-mono">
                          {localReport.studentMatrix}
                        </p>
                      </div>
                    </div>
                  )}
                  {localReport.studentPhone && (
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-gray-500 mt-0.5 dark:text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Phone Number</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {localReport.studentPhone}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Incident Details */}
            <Card className="border-gray-200 bg-white dark:bg-slate-800/50 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Incident Details</span>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                      <p className="text-sm font-medium mt-1 text-gray-800 dark:text-gray-200">
                        {categoryLabels[rawReport.incidentCategory || localReport.incidentCategory] || rawReport.incidentCategory || localReport.incidentCategory || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Date & Time
                      </p>
                      <p className="text-sm font-medium mt-1 text-gray-800 dark:text-gray-200">{date} at {time}</p>
                    </div>
                  </div>

                  {/* Location Area - NEW SECTION */}
                  {locationAreaDisplay && locationAreaDisplay !== 'Not specified' && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Location Area
                      </p>
                      <div className="mt-1 bg-white p-3 rounded-lg border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {locationAreaDisplay}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Specific Address - UPDATED */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Specific Address
                    </p>
                    <div className="mt-1 bg-white p-3 rounded-lg border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                      {specificAddress && specificAddress !== 'No address specified' ? (
                        <>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {specificAddress}
                          </p>
                          {reporterResidence && reporterResidence !== 'Unknown Location' &&
                           !specificAddress.toLowerCase().includes(reporterResidence.toLowerCase()) && (
                            <p className="text-xs text-gray-500 mt-2 pt-1 border-t border-gray-100 dark:text-gray-400 dark:border-slate-700">
                              👤 Reporter's residence: {getLocationAreaName(reporterResidence)}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-amber-600 dark:text-amber-400">
                            ⚠️ No specific address provided
                          </p>
                          {reporterResidence && reporterResidence !== 'Unknown Location' && (
                            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                              Reported from: {getLocationAreaName(reporterResidence)} area
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Description</p>
                    <div className="mt-1 bg-white p-3 rounded-lg border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                      <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                        {rawReport.description || localReport.description || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Injuries & Damages */}
            <Card className="border-gray-200 bg-white dark:bg-slate-800/50 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Injuries & Damages</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Injuries</p>
                    <p className="text-sm font-medium mt-1 text-gray-800 dark:text-gray-200">
                      {rawReport.injuries || localReport.injuries || 'None reported'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Damages</p>
                    <p className="text-sm font-medium mt-1 text-gray-800 dark:text-gray-200">
                      {rawReport.damages || localReport.damages || 'None reported'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suspect Information */}
            {(rawReport.suspectDescription || localReport.suspectDescription) && (
              <Card className="border-gray-200 bg-white dark:bg-slate-800/50 dark:border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Suspect Information</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Suspect Description</p>
                    <div className="mt-1 bg-white p-3 rounded-lg border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                      <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                        {rawReport.suspectDescription || localReport.suspectDescription}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attachments */}
            <Card className="border-gray-200 bg-white dark:bg-slate-800/50 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Image className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Attachments</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({attachmentUrls.length} files)
                  </span>
                </div>
                {attachmentUrls.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {attachmentUrls.map((url, idx) => {
                      const resolved = resolveUrl(url);
                      const isImageFile = isImage(url);

                      return isImageFile ? (
                        <button
                          key={idx}
                          onClick={() => setLightboxUrl(resolved)}
                          className="rounded-xl overflow-hidden border border-gray-200 hover:border-amber-400 transition-colors aspect-square bg-gray-100 relative group dark:border-slate-700 dark:bg-slate-700"
                        >
                          <img
                            src={getOptimizedImageUrl(resolved)}
                            alt={`Attachment ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Image failed to load:', resolved);
                              e.target.onerror = null;
                              e.target.src = 'https://placehold.co/400x400?text=Image+Load+Failed';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </button>
                      ) : (
                        <a
                          key={idx}
                          href={resolved}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl border border-gray-200 hover:border-amber-400 transition-colors text-center bg-white dark:border-slate-700 dark:bg-slate-800 dark:hover:border-amber-600"
                        >
                          <FileText className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                          <span className="text-xs text-gray-500 truncate w-full dark:text-gray-400">
                            {url.split('/').pop()?.slice(0, 20) || `File ${idx + 1}`}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-amber-50/30 dark:border-slate-700 dark:bg-slate-800/30">
                    <Image className="w-8 h-8 text-gray-400 mx-auto mb-2 dark:text-gray-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No attachments</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status & Assignment */}
            <Card className="border-gray-200 bg-white dark:bg-slate-800/50 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status & Assignment</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Assigned Officer</p>
                    <p className="text-sm font-medium mt-1 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                      <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      {localReport.officerName || rawReport.officerName || 'Not assigned'}
                    </p>
                  </div>
                  {(rawReport.officerNotes || localReport.officerNotes) && (
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-800">
                      <p className="text-xs text-amber-700 font-medium dark:text-amber-400">Officer Notes</p>
                      <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap dark:text-gray-300">
                        {rawReport.officerNotes || localReport.officerNotes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Report Metadata */}
            <Card className="border-gray-200 bg-white dark:bg-slate-800/50 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Report Metadata</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reported At</p>
                    <p className="text-sm font-medium mt-1 text-gray-800 dark:text-gray-200">
                      {rawReport.reportedAt || localReport.reportedAt
                        ? new Date(rawReport.reportedAt || localReport.reportedAt).toLocaleString('en-MY')
                        : '—'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Last Updated</p>
                    <p className="text-sm font-medium mt-1 text-gray-800 dark:text-gray-200">
                      {rawReport.updatedAt || localReport.updatedAt
                        ? new Date(rawReport.updatedAt || localReport.updatedAt).toLocaleString('en-MY')
                        : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                className="text-gray-700 border-gray-700 rounded-xl gap-2 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700"
                onClick={() => setIsEditingOpen(true)}
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl gap-2"
                onClick={handleMarkResolved}
                disabled={rawReport.status === 'resolved' || localReport.status === 'resolved' || isResolving}
              >
                {isResolving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Mark as Resolved</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {lightbox}

      <ReportsEditing
        report={rawReport}
        isOpen={isEditingOpen}
        onClose={() => setIsEditingOpen(false)}
        onSaveSuccess={handleSaveChanges}
      />
    </>
  );
};
