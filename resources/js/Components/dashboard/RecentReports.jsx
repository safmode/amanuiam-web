import { MapPin, User, Calendar, Eye, ChevronRight, Phone, Mail, Building2, LocateFixed } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { statusLabels, urgencyLabels } from '@/Pages/Reports';
import { Link } from '@inertiajs/react';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
  resolved: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
  // nfa removed - if existing reports have nfa, fallback to resolved style
};

const urgencyColors = {
  general: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
  urgent: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
};

// Helper function to get the best available location display
const getLocationDisplay = (report) => {
  // Priority 1: Use location.address if available
  if (report.address && report.address !== 'No address specified' && report.address !== '') {
    return report.address;
  }

  // Priority 2: Use location.locationArea + building from location object
  if (report.locationRaw) {
    const locationObj = report.locationRaw;
    if (locationObj.locationArea) {
      const building = locationObj.building ? `, ${locationObj.building}` : '';
      return `${locationObj.locationArea}${building}`;
    }
    if (locationObj.address) {
      return locationObj.address;
    }
  }

  // Priority 3: Use locationArea + building from report root
  if (report.locationArea) {
    const building = report.building ? `, ${report.building}` : '';
    return `${report.locationArea}${building}`;
  }

  // Priority 4: Fallback to mahallah
  if (report.mahallah && report.mahallah !== 'Unknown Location') {
    return report.mahallah;
  }

  return 'Location not specified';
};

// Helper function to get full location details for tooltip
const getLocationDetails = (report) => {
  let locationArea = '';
  let building = '';
  let address = '';
  let mahallah = '';

  // Try to extract from location object
  if (report.locationRaw && typeof report.locationRaw === 'object') {
    locationArea = report.locationRaw.locationArea || '';
    building = report.locationRaw.building || '';
    address = report.locationRaw.address || '';
  }

  // Fallback to root properties
  if (!locationArea && report.locationArea) locationArea = report.locationArea;
  if (!building && report.building) building = report.building;
  if (!address && report.address) address = report.address;
  if (!mahallah && report.mahallah) mahallah = report.mahallah;

  return { locationArea, building, address, mahallah };
};

export const RecentReports = ({ reports, onViewReport, loading = false }) => {
  const getStatusBadge = (status) => {
    // If status is nfa, treat it as resolved for display
    let displayStatus = status;
    let displayLabel = statusLabels[status];

    if (status === 'nfa') {
      displayStatus = 'resolved';
      displayLabel = 'Resolved (Previous NFA)';
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`${statusColors[displayStatus] || statusColors.pending} text-xs font-medium cursor-help`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
              {displayLabel}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {status === 'pending' && 'Report awaiting review'}
              {status === 'in_progress' && 'Officer is handling this case'}
              {status === 'resolved' && 'Case has been resolved'}
              {status === 'nfa' && 'Case resolved - No further action required'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const getUrgencyBadge = (urgency) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${urgencyColors[urgency]} text-xs cursor-help`}>
            {urgencyLabels[urgency]}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {urgency === 'general' && 'General priority - routine matter'}
            {urgency === 'urgent' && 'Urgent - immediate response needed'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  // Get reporter display name
  const getReporterDisplayName = (report) => {
    if (report.studentName && report.studentName !== 'Unknown' && report.studentName !== 'No student linked') {
      return report.studentName;
    }
    if (report.reporterName && report.reporterName !== 'Unknown' && report.reporterName !== 'No student linked') {
      return report.reporterName;
    }
    return 'Unknown Reporter';
  };

  // Get reporter details for tooltip
  const getReporterDetails = (report) => {
    return {
      type: report.reporter_type_display || (report.reporter_type === 'registered' ? 'Registered Student' : report.reporter_type === 'unregistered' ? 'Unregistered Reporter' : 'Reporter'),
      name: report.studentName || report.reporterName || 'Unknown',
      email: report.studentEmail || report.reporterEmail,
      phone: report.studentPhone || report.reporterContact,
      matric: report.studentMatrix || report.reporterMatricNo,
      showMatric: !!(report.studentMatrix || report.reporterMatricNo),
      showEmail: !!(report.studentEmail || report.reporterEmail),
      showPhone: !!(report.studentPhone || report.reporterContact)
    };
  };

  // Show loading skeletons when loading is true
  if (loading) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Reports</h3>
            <div className="h-5 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 animate-pulse">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-20 bg-gray-200 dark:bg-slate-600 rounded" />
                    <div className="h-5 w-16 bg-gray-200 dark:bg-slate-600 rounded" />
                    <div className="h-5 w-16 bg-gray-200 dark:bg-slate-600 rounded" />
                  </div>
                  <div className="h-8 w-8 bg-gray-200 dark:bg-slate-600 rounded" />
                </div>
                <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-2/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show actual reports when not loading
  return (
    <Card className="bg-white dark:bg-slate-800 border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Reports</h3>
          <Link href="/Reports" className="text-sm text-[#D4A853] hover:underline flex items-center gap-1">
            View all reports
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-4">
          {reports.map((report) => {
            const reporterDetails = getReporterDetails(report);
            const displayName = getReporterDisplayName(report);
            const locationDisplay = getLocationDisplay(report);
            const locationDetails = getLocationDetails(report);

            const hasDetailedLocation = locationDetails.locationArea || locationDetails.building || locationDetails.address;

            return (
              <div
                    key={report.id}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group"
                    onClick={() => onViewReport(report)}  // This passes the entire report object
                >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-mono text-muted-foreground">{report.id}</span>
                    {getUrgencyBadge(report.urgency)}
                    {getStatusBadge(report.status)}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#D4A853] hover:text-[#C49A48] hover:bg-[#D4A853]/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>

                <h4 className="font-semibold mb-2 line-clamp-2">{report.issue}</h4>

                {/* Location Section - Enhanced with detailed tooltip */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 cursor-help hover:text-[#D4A853] transition-colors">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{locationDisplay}</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm">
                        <div className="text-xs space-y-1.5 p-1">
                          <p className="font-semibold text-[#D4A853] mb-1">📍 Location Details</p>
                          {locationDetails.locationArea && (
                            <p className="flex items-start gap-1">
                              <span className="font-medium min-w-[70px]">Area:</span>
                              <span>{locationDetails.locationArea}</span>
                            </p>
                          )}
                          {locationDetails.building && (
                            <p className="flex items-start gap-1">
                              <span className="font-medium min-w-[70px]">Building:</span>
                              <span className="break-words">{locationDetails.building}</span>
                            </p>
                          )}
                          {locationDetails.address && locationDetails.address !== locationDetails.locationArea && (
                            <p className="flex items-start gap-1">
                              <span className="font-medium min-w-[70px]">Address:</span>
                              <span className="break-words">{locationDetails.address}</span>
                            </p>
                          )}
                          {locationDetails.mahallah && !locationDetails.locationArea && (
                            <p className="flex items-start gap-1">
                              <span className="font-medium min-w-[70px]">Mahallah:</span>
                              <span>{locationDetails.mahallah}</span>
                            </p>
                          )}
                          {!hasDetailedLocation && (
                            <p className="text-muted-foreground italic">No detailed location information available</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Reporter and Date Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 cursor-help hover:text-[#D4A853] transition-colors">
                          <User className="w-4 h-4" />
                          <span className="line-clamp-1">{displayName}</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <div className="text-xs space-y-1 p-1">
                          <p className="font-semibold text-[#D4A853] mb-1">👤 Reporter Details</p>
                          <p className="font-medium">{reporterDetails.type}</p>
                          <p>Name: {reporterDetails.name}</p>
                          {reporterDetails.showEmail && reporterDetails.email && (
                            <p className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {reporterDetails.email}
                            </p>
                          )}
                          {reporterDetails.showPhone && reporterDetails.phone && (
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {reporterDetails.phone}
                            </p>
                          )}
                          {reporterDetails.showMatric && reporterDetails.matric && (
                            <p className="mt-1">Matric: {reporterDetails.matric}</p>
                          )}
                          {!reporterDetails.showEmail && !reporterDetails.showPhone && !reporterDetails.showMatric && (
                            <p className="text-muted-foreground italic">No contact information available</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {report.date} at {report.time}
                  </span>
                </div>
              </div>
            );
          })}

          {reports.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No reports found</p>
              <p className="text-sm mt-1">Create a new report to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
