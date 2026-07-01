// Dashboard.jsx - No Axios, Pure Fetch API
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import { RecentReports } from '@/components/dashboard/RecentReports';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { EmergencyAlertBanner } from '@/components/dashboard/EmergencyAlerts';
import { HeatmapPreview } from '@/components/dashboard/HeatmapPreview';
import { ReportDetailsModal } from '@/components/dashboard/ReportsDetailsModal';
import { AddReport } from '@/components/dashboard/AddReport';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Send,
  BarChart3,
  Users
} from 'lucide-react';
import { router } from '@inertiajs/react';
import SafetyTips from '@/components/dashboard/SafetyTips';

// Import locationLabels if needed for formatting
import { locationLabels } from '@/Pages/Reports';

const Dashboard = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddReportOpen, setIsAddReportOpen] = useState(false);

  // State for real data
  const [recentReports, setRecentReports] = useState([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    inProgressReports: 0,
    resolvedReports: 0,
    nfaReports: 0,
    emergencyAlerts: 0
  });
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Helper function to get CSRF token if needed
  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  };

  // Helper function to format location name
  const formatLocationName = (location) => {
    if (!location) return '';
    // Try to match with locationLabels
    for (const group of Object.values(locationLabels || {})) {
      for (const [key, label] of Object.entries(group)) {
        if (key === location || label === location) {
          return label;
        }
      }
    }
    return location;
  };

  // Fetch dashboard data (reports and stats)
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/reports/recent');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log('Raw API data:', data);
      console.log('First report:', data.recentReports?.[0]);

      setRecentReports(data.recentReports || []);
      setStats({
        totalReports: data.stats?.totalReports || 0,
        pendingReports: data.stats?.pendingReports || 0,
        inProgressReports: data.stats?.inProgressReports || 0,
        resolvedReports: data.stats?.resolvedReports || 0,
        nfaReports: data.stats?.nfaReports || 0,
        emergencyAlerts: data.stats?.emergencyAlerts || 0
      });
      setLastUpdated(data.lastUpdated);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch hotspot data from the API
  const fetchHotspotData = async () => {
    try {
      const response = await fetch('/heatmap-data');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setHotspots(data.hotspots || []);
    } catch (error) {
      console.error('Error fetching hotspot data:', error);
      // Fallback: generate hotspots from recent reports
      if (recentReports.length > 0) {
        const generatedHotspots = generateHotspotsFromReports(recentReports);
        setHotspots(generatedHotspots);
      }
    }
  };

  // Generate hotspots from reports (fallback method)
  const generateHotspotsFromReports = (reports) => {
    const locationMap = new Map();

    reports.forEach(report => {
      // Use determinedLocation or locationArea
      let locationName = report.determinedLocation || report.locationArea || report.mahallah;
      if (!locationName) return;

      // Format the location name
      locationName = formatLocationName(locationName);

      if (!locationMap.has(locationName)) {
        locationMap.set(locationName, {
          location: locationName,
          incidents: 0,
          breakdown: {}
        });
      }

      const hotspot = locationMap.get(locationName);
      hotspot.incidents++;

      const category = report.incidentCategory || 'other';
      hotspot.breakdown[category] = (hotspot.breakdown[category] || 0) + 1;
    });

    return Array.from(locationMap.values())
      .sort((a, b) => b.incidents - a.incidents)
      .slice(0, 5);
  };

  // Set up polling for real-time updates (every 30 seconds)
  useEffect(() => {
    fetchDashboardData();
    fetchHotspotData();

    const interval = setInterval(() => {
      fetchDashboardData();
      fetchHotspotData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Refresh hotspots when recentReports changes (as fallback)
  useEffect(() => {
    if (recentReports.length > 0 && hotspots.length === 0) {
      const generatedHotspots = generateHotspotsFromReports(recentReports);
      setHotspots(generatedHotspots);
    }
  }, [recentReports]);

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  const handleCreateReport = () => {
    // Refresh the data after creating a new report
    fetchDashboardData();
    fetchHotspotData();
  };

  const handleReportUpdate = () => {
    // Refresh data when report is updated
    fetchDashboardData();
    fetchHotspotData();
  };

  // ============================================
  // FIXED: Transform report data with ALL fields
  // ============================================
  const formattedReports = recentReports.map(report => {
    // Get the raw report data (in case it's wrapped)
    const raw = report._raw || report;

    // Determine location area - PRIORITIZE determinedLocation from backend
    let locationArea = 'Unknown';
    if (raw.determinedLocation) {
      locationArea = formatLocationName(raw.determinedLocation);
    } else if (raw.location?.locationArea) {
      locationArea = formatLocationName(raw.location.locationArea);
    } else if (raw.mahallah && raw.mahallah !== 'Unknown Location') {
      locationArea = formatLocationName(raw.mahallah);
    } else if (raw.locationArea && raw.locationArea !== 'Not specified') {
      locationArea = formatLocationName(raw.locationArea);
    }

    // Determine specific address
    let specificAddress = 'No address specified';
    if (raw.specificAddress && raw.specificAddress !== 'Not specified') {
      specificAddress = raw.specificAddress;
    } else if (raw.location?.specificPlace) {
      specificAddress = raw.location.specificPlace;
    } else if (raw.location?.building) {
      specificAddress = raw.location.building;
    } else if (raw.building) {
      specificAddress = raw.building;
    } else if (raw.location?.address) {
      specificAddress = raw.location.address;
    } else if (raw.address) {
      specificAddress = raw.address;
    }

    // Build full address for display
    let fullAddress = specificAddress;
    if (locationArea && locationArea !== 'Unknown' &&
        specificAddress && specificAddress !== 'No address specified') {
      // Check if specific address already contains the location area
      if (!specificAddress.includes(locationArea)) {
        fullAddress = `${locationArea} - ${specificAddress}`;
      }
    } else if (locationArea && locationArea !== 'Unknown') {
      fullAddress = locationArea;
    }

    // Get reporter name
    const reporterName = raw.studentName || raw.reporterName || 'Unknown Reporter';

    // Format date/time
    const incidentDate = raw.incidentDateTime || raw.reportedAt;
    const date = incidentDate ? new Date(incidentDate).toLocaleDateString('en-MY') : 'Unknown';
    const time = incidentDate ? new Date(incidentDate).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }) : 'Unknown';

    return {
      // Basic fields
      id: raw.reportId || raw.id,
      reportId: raw.reportId || raw.id,
      issue: raw.description?.substring(0, 100) + (raw.description?.length > 100 ? '...' : '') || 'No description',
      description: raw.description || 'No description',

      // Status & Urgency
      status: raw.status || 'pending',
      urgency: raw.urgency || 'general',

      // Date/Time
      date: date,
      time: time,
      incidentDateTime: raw.incidentDateTime,
      reportedAt: raw.reportedAt,

      // ============================================
      // LOCATION FIELDS - USING BACKEND DATA
      // ============================================
      locationArea: locationArea,                    // "KICT (ICT)"
      specificAddress: specificAddress,              // "LR 13"
      address: fullAddress,                         // "KICT (ICT) - LR 13"
      building: raw.location?.building || raw.building || null,
      mahallah: raw.mahallah || null,
      locationRaw: raw.location || null,

      // ✅ IMPORTANT: Pass through determinedLocation from backend
      determinedLocation: raw.determinedLocation || null,

      // ============================================
      // REPORTER FIELDS
      // ============================================
      reporterName: reporterName,
      reporterContact: raw.studentPhone || raw.reporterContact || 'Not provided',
      reporterEmail: raw.studentEmail || raw.reporterEmail || null,
      reporterMatricNo: raw.studentMatrix || raw.reporterMatricNo || null,
      reporter_type_display: raw.reporter_type_display ||
                            (raw.reporter_type === 'registered' ? 'Registered Student' :
                             raw.reporter_type === 'unregistered' ? 'Unregistered Reporter' : 'Reporter'),
      reporter_type: raw.reporter_type || 'unregistered',

      studentName: raw.studentName || raw.reporterName || 'Unknown',
      studentEmail: raw.studentEmail || raw.reporterEmail || null,
      studentPhone: raw.studentPhone || raw.reporterContact || null,
      studentMatrix: raw.studentMatrix || raw.reporterMatricNo || null,

      // ============================================
      // OTHER FIELDS
      // ============================================
      incidentCategory: raw.incidentCategory || raw.category || 'other',
      injuries: raw.injuries || null,
      damages: raw.damages || null,
      suspectDescription: raw.suspectDescription || null,
      officerNotes: raw.officerNotes || null,
      assignedOfficer: raw.assignedOfficer || null,
      officerName: raw.officerName || 'Not assigned',
      attachmentUrls: raw.attachmentUrls || [],
      attachmentPublicIds: raw.attachmentPublicIds || [],

      // Keep raw data for reference
      _raw: raw
    };
  });

  console.log('Formatted reports:', formattedReports);
  if (formattedReports.length > 0) {
    console.log('First formatted report location:', {
      locationArea: formattedReports[0].locationArea,
      specificAddress: formattedReports[0].specificAddress,
      address: formattedReports[0].address,
      determinedLocation: formattedReports[0].determinedLocation,
      locationRaw: formattedReports[0].locationRaw
    });
  }

  return (
    <DashboardLayout>
      {/* Quick Statistics */}
      <StatsOverview stats={stats} loading={loading} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Reports */}
        <div className="lg:col-span-2">
          <RecentReports
            reports={formattedReports.slice(0, 5)}
            onViewReport={handleViewReport}
            loading={loading}
          />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-white dark:bg-slate-800 border-border">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="h-auto py-3 px-3 flex flex-col items-center gap-1.5 bg-[#D4A853] hover:bg-[#C49A48] text-white"
                  onClick={() => setIsAddReportOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-xs font-medium">Add Report</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 px-3 flex flex-col items-center gap-1.5 border-border"
                  onClick={() => router.visit('/Alerts')}
                >
                  <Send className="w-4 h-4" />
                  <span className="text-xs font-medium">Send Alert</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 px-3 flex flex-col items-center gap-1.5 border-border"
                  onClick={() => router.visit('/Statistics')}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-xs font-medium">Statistics</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 px-3 flex flex-col items-center gap-1.5 border-border"
                  onClick={() => router.visit('/Officers')}
                >
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium">View Officer</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Incident Hotspots */}
          <HeatmapPreview hotspots={hotspots} />
        </div>
      </div>

      {/* Report Details Modal */}
      <ReportDetailsModal
        report={selectedReport}
        isOpen={isModalOpen}
        onClose={closeModal}
        onUpdate={handleReportUpdate}
      />

      {/* Add Report Modal */}
      <AddReport
        isOpen={isAddReportOpen}
        onClose={() => setIsAddReportOpen(false)}
        onSave={handleCreateReport}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
