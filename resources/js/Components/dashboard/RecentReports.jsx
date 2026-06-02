import { MapPin, User, Calendar, Eye, ChevronRight, Phone, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import axios from 'axios';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
  inProgress: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
  resolved: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
};

const urgencyColors = {
  general: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
  urgent: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
};

// Helper function to get the best available location display
const getLocationDisplay = (report) => {
  // Priority 1: Check locationRaw object (from MongoDB)
  if (report.locationRaw) {
    if (report.locationRaw.address && report.locationRaw.address !== 'No address specified') {
      return report.locationRaw.address;
    }
    if (report.locationRaw.locationArea) {
      const building = report.locationRaw.building ? `, ${report.locationRaw.building}` : '';
      const specificPlace = report.locationRaw.specificPlace ? `, ${report.locationRaw.specificPlace}` : '';
      return `${report.locationRaw.locationArea}${building}${specificPlace}`;
    }
  }

  // Priority 2: Check location object (direct from report)
  if (report.location && typeof report.location === 'object') {
    if (report.location.address) {
      return report.location.address;
    }
    if (report.location.locationArea) {
      const building = report.location.building ? `, ${report.location.building}` : '';
      const specificPlace = report.location.specificPlace ? `, ${report.location.specificPlace}` : '';
      return `${report.location.locationArea}${building}${specificPlace}`;
    }
  }

  // Priority 3: Use extracted root-level fields from backend
  if (report.address && report.address !== 'No address specified') {
    return report.address;
  }
  if (report.locationArea) {
    const building = report.building ? `, ${report.building}` : '';
    const specificPlace = report.specificPlace ? `, ${report.specificPlace}` : '';
    return `${report.locationArea}${building}${specificPlace}`;
  }

  // Priority 4: Fallback to mahallah
  if (report.mahallah && report.mahallah !== 'Unknown Location') {
    return report.mahallah;
  }

  return '⚠️ No specific location provided';
};

// Helper function to get full location details for tooltip
const getLocationDetails = (report) => {
  let locationArea = '';
  let building = '';
  let address = '';
  let mahallah = '';
  let specificPlace = '';

  if (report.locationRaw && typeof report.locationRaw === 'object') {
    locationArea = report.locationRaw.locationArea || '';
    building = report.locationRaw.building || '';
    address = report.locationRaw.address || '';
    specificPlace = report.locationRaw.specificPlace || '';
  }

  if (!locationArea && report.location && typeof report.location === 'object') {
    locationArea = report.location.locationArea || '';
    building = report.location.building || '';
    address = report.location.address || '';
    specificPlace = report.location.specificPlace || '';
  }

  if (!locationArea && report.locationArea) locationArea = report.locationArea;
  if (!building && report.building) building = report.building;
  if (!address && report.address) address = report.address;
  if (!specificPlace && report.specificPlace) specificPlace = report.specificPlace;
  if (!mahallah && report.mahallah) mahallah = report.mahallah;

  return { locationArea, building, address, mahallah, specificPlace };
};

export const RecentReports = ({ reports: initialReports, onViewReport, loading = false }) => {
  const [reports, setReports] = useState(initialReports || []);
  const [isLoading, setIsLoading] = useState(loading);

  useEffect(() => {
    const fetchReports = async () => {
      // If we already have initial reports from props, use them
      if (initialReports && initialReports.length > 0) {
        console.log('Using initial reports from props:', initialReports.length);
        setReports(initialReports);
        return;
      }

      // Otherwise fetch from API
      setIsLoading(true);
      try {
        console.log('Fetching recent reports from /dashboard/recent-data...');
        // FIXED: Changed from /dashboard/recent-reports to /dashboard/recent-data
        const response = await axios.get('/dashboard/recent-data');
        console.log('API Response:', response.data);

        if (response.data && response.data.recentReports) {
          console.log('Reports found:', response.data.recentReports.length);
          if (response.data.recentReports.length > 0) {
            console.log('Sample report:', response.data.recentReports[0]);
          }
          setReports(response.data.recentReports);
        } else {
          console.log('No recentReports in response data');
          setReports([]);
        }
      } catch (error) {
        console.error('Error fetching recent reports:', error);
        console.error('Error details:', error.response?.data);
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [initialReports]);

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
            {status === 'nfa' && 'No further action required'}
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

  if (isLoading) {
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
            const hasDetailedLocation = locationDetails.locationArea || locationDetails.building || locationDetails.address || locationDetails.specificPlace;

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

                {/* Location Section */}
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
                          {locationDetails.specificPlace && (
                            <p className="flex items-start gap-1">
                              <span className="font-medium min-w-[70px]">Place:</span>
                              <span className="break-words">{locationDetails.specificPlace}</span>
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
                          <span className="line-clamp-1">{report.studentName || 'Unknown Reporter'}</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <div className="text-xs space-y-1 p-1">
                          <p className="font-semibold text-[#D4A853] mb-1">👤 Reporter Details</p>
                          <p className="font-medium">{report.reporter_type_display || 'Reporter'}</p>
                          <p>Name: {report.studentName || 'Unknown'}</p>
                          {report.studentEmail && (
                            <p className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {report.studentEmail}
                            </p>
                          )}
                          {report.studentPhone && (
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {report.studentPhone}
                            </p>
                          )}
                          {report.studentMatrix && (
                            <p className="mt-1">Matric: {report.studentMatrix}</p>
                          )}
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

          {reports.length === 0 && !isLoading && (
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
