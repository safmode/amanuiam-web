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
      in_progress: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
      resolved: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      // nfa style removed - if an existing report has nfa status, it will fall back to default
    };
    // If status is nfa, treat it as resolved for display purposes
    if (status === 'nfa') {
      return <Badge className={`${styles.resolved} text-xs border`}>Resolved (Previous NFA)</Badge>;
    }
    return <Badge className={`${styles[status] || styles.pending} text-xs border`}>{statusLabels[status] || status}</Badge>;
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

  // FIXED: Proper function to get incident location from various data structures
  const getIncidentLocation = (reportData) => {
    if (!reportData) return 'No address specified';

    console.log('Getting location for report:', reportData.reportId || reportData.id);
    console.log('Report data structure:', reportData);

    // Method 1: Check locationRaw (passed from formattedReports)
    if (reportData.locationRaw && typeof reportData.locationRaw === 'object') {
      if (reportData.locationRaw.address) {
        console.log('Found locationRaw.address:', reportData.locationRaw.address);
        return reportData.locationRaw.address;
      }
      if (reportData.locationRaw.building && reportData.locationRaw.locationArea) {
        const loc = `${reportData.locationRaw.locationArea}, ${reportData.locationRaw.building}`;
        console.log('Found locationRaw combo:', loc);
        return loc;
      }
      if (reportData.locationRaw.locationArea) {
        console.log('Found locationRaw.locationArea:', reportData.locationRaw.locationArea);
        return reportData.locationRaw.locationArea;
      }
      if (reportData.locationRaw.building) {
        console.log('Found locationRaw.building:', reportData.locationRaw.building);
        return reportData.locationRaw.building;
      }
    }

    // Method 2: Check direct location property
    if (reportData.location && typeof reportData.location === 'object') {
      if (reportData.location.address) {
        console.log('Found location.address:', reportData.location.address);
        return reportData.location.address;
      }
      if (reportData.location.building && reportData.location.locationArea) {
        const loc = `${reportData.location.locationArea}, ${reportData.location.building}`;
        console.log('Found location combo:', loc);
        return loc;
      }
      if (reportData.location.locationArea) {
        console.log('Found location.locationArea:', reportData.location.locationArea);
        return reportData.location.locationArea;
      }
    }

    // Method 3: Check address/building fields
    if (reportData.address) {
      console.log('Found address field:', reportData.address);
      return reportData.address;
    }

    if (reportData.building && reportData.locationArea) {
      const loc = `${reportData.locationArea}, ${reportData.building}`;
      console.log('Found building + locationArea combo:', loc);
      return loc;
    }

    if (reportData.locationArea) {
      console.log('Found locationArea field:', reportData.locationArea);
      return reportData.locationArea;
    }

    if (reportData.building) {
      console.log('Found building field:', reportData.building);
      return reportData.building;
    }

    // Method 4: Check mahallah as fallback
    if (reportData.mahallah && reportData.mahallah !== 'Unknown Location') {
      console.log('Fallback to mahallah:', reportData.mahallah);
      return `${reportData.mahallah} area`;
    }

    // Method 5: Check incidentLocation from backend
    if (reportData.incidentLocation && reportData.incidentLocation !== 'No address specified') {
      console.log('Found incidentLocation:', reportData.incidentLocation);
      return reportData.incidentLocation;
    }

    console.log('No location found');
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

  // Get the raw report data (handle both direct and wrapped structures)
  const rawReport = localReport._raw || localReport;
  const { date, time } = formatDateTime(rawReport.incidentDateTime || localReport.incidentDateTime);

  // Get location - use the improved function with the full report data
  const incidentLocation = getIncidentLocation(localReport);

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
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto rounded-2xl p-0 dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader className="p-6 pb-2 border-b border-gray-100 dark:border-slate-700">
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
            <Card className="border-gray-100 dark:bg-slate-800 dark:border-slate-700 dark:to-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center dark:bg-amber-900/20">
                    <User className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Reporter Information</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-orange-400 mt-0.5 dark:text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Full Name</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {localReport.studentName || localReport.reporterName || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-orange-400 mt-0.5 dark:text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email Address</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 break-all">
                        {localReport.studentEmail || localReport.reporterEmail || '—'}
                      </p>
                    </div>
                  </div>
                  {localReport.studentMatrix && (
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 text-orange-400 mt-0.5 flex items-center justify-center dark:text-orange-500">
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
                      <Phone className="w-4 h-4 text-orange-400 mt-0.5 dark:text-orange-500" />
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
            <Card className="bg-gray-50/50 border-gray-100 dark:bg-slate-800/50 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Incident Details</span>
                </div>
                <div className="space-y-4">
                  {/* Category and Date/Time */}
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

                  {/* Incident Location - FIXED */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Incident Location
                    </p>
                    <div className="mt-1 bg-white p-3 rounded-lg border border-gray-100 dark:bg-slate-800 dark:border-slate-700">
                      {incidentLocation && incidentLocation !== 'No address specified' ? (
                        <>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {incidentLocation}
                          </p>
                          {/* Show reporter's residence if different from incident location */}
                          {reporterResidence && reporterResidence !== 'Unknown Location' &&
                           !incidentLocation.toLowerCase().includes(reporterResidence.toLowerCase()) && (
                            <p className="text-xs text-gray-400 mt-2 pt-1 border-t border-gray-100 dark:text-gray-500 dark:border-slate-700">
                              👤 Reporter's residence: {getLocationAreaName(reporterResidence)}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-amber-600 dark:text-amber-400">
                            ⚠️ No specific location provided
                          </p>
                          {reporterResidence && reporterResidence !== 'Unknown Location' && (
                            <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">
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
                    <p className="text-sm whitespace-pre-wrap mt-1 bg-white p-3 rounded-lg border border-gray-100 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300">
                      {rawReport.description || localReport.description || '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Injuries & Damages */}
            <Card className="bg-gray-50/50 border-gray-100 dark:bg-slate-800/50 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Injuries & Damages</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-gray-100 dark:bg-slate-800 dark:border-slate-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Injuries</p>
                    <p className="text-sm font-medium mt-1 text-red-600 dark:text-red-400">
                      {rawReport.injuries || localReport.injuries || 'None reported'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100 dark:bg-slate-800 dark:border-slate-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Damages</p>
                    <p className="text-sm font-medium mt-1 text-amber-600 dark:text-amber-400">
                      {rawReport.damages || localReport.damages || 'None reported'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suspect Information */}
            {(rawReport.suspectDescription || localReport.suspectDescription) && (
              <Card className="bg-gray-50/50 border-gray-100 dark:bg-slate-800/50 dark:border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Suspect Information</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Suspect Description</p>
                    <p className="text-sm whitespace-pre-wrap mt-1 bg-white p-3 rounded-lg border border-gray-100 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300">
                      {rawReport.suspectDescription || localReport.suspectDescription}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attachments */}
            <Card className="bg-gray-50/50 border-gray-100 dark:bg-slate-800/50 dark:border-slate-700">
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
                  <div className="border border-gray-200 rounded-xl p-6 text-center bg-gray-50 dark:border-slate-700 dark:bg-slate-800">
                    <Image className="w-8 h-8 text-gray-400 mx-auto mb-2 dark:text-gray-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No attachments</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status & Assignment */}
            <Card className="bg-gray-50/50 border-gray-100 dark:bg-slate-800/50 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status & Assignment</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-gray-100 dark:bg-slate-800 dark:border-slate-700">
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
            <Card className="bg-gray-50/50 border-gray-100 dark:bg-slate-800/50 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Report Metadata</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3 border border-gray-100 dark:bg-slate-800 dark:border-slate-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reported At</p>
                    <p className="text-sm font-medium mt-1 text-gray-800 dark:text-gray-200">
                      {rawReport.reportedAt || localReport.reportedAt
                        ? new Date(rawReport.reportedAt || localReport.reportedAt).toLocaleString('en-MY')
                        : '—'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-100 dark:bg-slate-800 dark:border-slate-700">
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
                className="rounded-xl gap-2 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-700"
                onClick={() => setIsEditingOpen(true)}
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl gap-2"
                onClick={handleMarkResolved}
                disabled={rawReport.status === 'resolved' || localReport.status === 'resolved' || rawReport.status === 'nfa' || localReport.status === 'nfa' || isResolving}
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
