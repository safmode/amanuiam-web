// RecentReports.jsx - Simplified version without locationRaw
import { MapPin, User, Calendar, Eye, ChevronRight, Phone, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from '@inertiajs/react';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
  inProgress: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
  resolved: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
};

const urgencyColors = {
  general: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
  urgent: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
};

const getLocationDisplay = (report) => {
  // Use fullAddress if available (from the model)
  if (report.fullAddress && report.fullAddress !== 'No address specified') {
    return report.fullAddress;
  }

  // Otherwise build from components
  if (report.locationArea) {
    const parts = [report.locationArea];
    if (report.specificPlace) parts.push(report.specificPlace);
    else if (report.building) parts.push(report.building);
    if (report.address && !parts.includes(report.address)) parts.push(report.address);
    return parts.join(', ');
  }

  return '⚠️ No specific location provided';
};

const getLocationDetails = (report) => {
  return {
    locationArea: report.locationArea || '',
    building: report.building || '',
    address: report.address || '',
    specificPlace: report.specificPlace || '',
    fullAddress: report.fullAddress || '',
  };
};

export const RecentReports = ({ reports = [], onViewReport, loading = false }) => {
  console.log('RecentReports received:', reports.length, 'reports');
  if (reports.length > 0) {
    console.log('Sample report data:', reports[0]);
    console.log('Location fields:', {
      locationArea: reports[0].locationArea,
      building: reports[0].building,
      specificPlace: reports[0].specificPlace,
      address: reports[0].address,
      fullAddress: reports[0].fullAddress,
    });
  }

  const statusLabels = {
    pending: 'Pending',
    inProgress: 'In Progress',
    resolved: 'Resolved',
    nfa: 'No Further Action',
  };

  const urgencyLabels = {
    general: 'General',
    urgent: 'Urgent',
  };

  const getStatusBadge = (status) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${statusColors[status]} text-xs font-medium cursor-help`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
            {statusLabels[status] || status}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {status === 'pending' && 'Report awaiting review'}
            {status === 'inProgress' && 'Officer is handling this case'}
            {status === 'resolved' && 'Case has been resolved'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const getUrgencyBadge = (urgency) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${urgencyColors[urgency]} text-xs cursor-help`}>
            {urgencyLabels[urgency] || urgency}
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

  const formatDateTime = (dateTime) => {
    if (!dateTime) return { date: 'Unknown date', time: 'Unknown time' };
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

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
                  </div>
                </div>
                <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

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
            const locationDisplay = getLocationDisplay(report);
            const locationDetails = getLocationDetails(report);
            const { date, time } = formatDateTime(report.incidentDateTime || report.reportedAt);

            return (
              <div
                key={report._id || report.id}
                className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group"
                onClick={() => onViewReport(report)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-mono text-muted-foreground">{report.reportId}</span>
                    {getUrgencyBadge(report.urgency)}
                    {getStatusBadge(report.status)}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-[#D4A853] hover:text-[#C49A48] hover:bg-[#D4A853]/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>

                <h4 className="font-semibold mb-2 line-clamp-2">{report.description?.substring(0, 100) || 'No description'}</h4>

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
                            <p><span className="font-medium">Area:</span> {locationDetails.locationArea}</p>
                          )}
                          {locationDetails.specificPlace && (
                            <p><span className="font-medium">Place:</span> {locationDetails.specificPlace}</p>
                          )}
                          {locationDetails.building && (
                            <p><span className="font-medium">Building:</span> {locationDetails.building}</p>
                          )}
                          {locationDetails.address && locationDetails.address !== locationDetails.locationArea && (
                            <p><span className="font-medium">Address:</span> {locationDetails.address}</p>
                          )}
                          {locationDetails.fullAddress && (
                            <p><span className="font-medium">Full:</span> {locationDetails.fullAddress}</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 cursor-help hover:text-[#D4A853] transition-colors">
                          <User className="w-4 h-4" />
                          <span>{report.studentName || 'Unknown Reporter'}</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <div className="text-xs space-y-1 p-1">
                          <p className="font-semibold text-[#D4A853] mb-1">👤 Reporter Details</p>
                          <p>Name: {report.studentName || 'Unknown'}</p>
                          {report.studentEmail && <p>📧 {report.studentEmail}</p>}
                          {report.studentPhone && <p>📞 {report.studentPhone}</p>}
                          {report.studentMatrix && <p>🎓 Matric: {report.studentMatrix}</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {date} at {time}
                  </span>
                </div>
              </div>
            );
          })}

          {reports.length === 0 && !loading && (
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
