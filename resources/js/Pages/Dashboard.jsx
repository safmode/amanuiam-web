// Dashboard.jsx - Pure Inertia (No Fetch, No Axios)
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
import { router, usePage } from '@inertiajs/react';
import SafetyTips from '@/components/dashboard/SafetyTips';

const Dashboard = () => {
  const { dashboardData: serverDashboardData } = usePage().props;
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

  // Load dashboard data from server props
  useEffect(() => {
    if (serverDashboardData) {
      setRecentReports(serverDashboardData.recentReports || []);
      setStats({
        totalReports: serverDashboardData.stats?.totalReports || 0,
        pendingReports: serverDashboardData.stats?.pendingReports || 0,
        inProgressReports: serverDashboardData.stats?.inProgressReports || 0,
        resolvedReports: serverDashboardData.stats?.resolvedReports || 0,
        nfaReports: serverDashboardData.stats?.nfaReports || 0,
        emergencyAlerts: serverDashboardData.stats?.emergencyAlerts || 0
      });
      setHotspots(serverDashboardData.hotspots || []);
      setLastUpdated(serverDashboardData.lastUpdated);
      setLoading(false);
    } else {
      // Fallback: reload to get data
      refreshDashboardData();
    }
  }, [serverDashboardData]);

  // Refresh dashboard data using Inertia
  const refreshDashboardData = () => {
    setLoading(true);
    router.reload({ only: ['dashboardData'] });
  };

  // Refresh hotspots when recentReports changes (as fallback)
  useEffect(() => {
    if (recentReports.length > 0 && hotspots.length === 0) {
      const generatedHotspots = generateHotspotsFromReports(recentReports);
      setHotspots(generatedHotspots);
    }
  }, [recentReports]);

  // Set up polling for real-time updates (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Generate hotspots from reports (fallback method)
  const generateHotspotsFromReports = (reports) => {
    const locationMap = new Map();

    reports.forEach(report => {
      // Use locationArea if available, otherwise mahallah
      let locationName = report.locationArea || report.mahallah;
      if (!locationName) return;

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
    refreshDashboardData();
  };

  const handleReportUpdate = () => {
    // Refresh data when report is updated
    refreshDashboardData();
  };

  // Transform report data to match your component's expected format
  const formattedReports = recentReports.map(report => ({
    id: report.reportId,
    reportId: report.reportId,
    issue: report.description?.substring(0, 100) + (report.description?.length > 100 ? '...' : ''),
    location: report.mahallah,
    locationArea: report.locationArea,
    building: report.building,
    address: report.address,
    locationRaw: report.location,
    mahallah: report.mahallah,
    status: report.status,
    urgency: report.urgency,
    date: new Date(report.incidentDateTime).toLocaleDateString(),
    time: new Date(report.incidentDateTime).toLocaleTimeString(),
    reporterName: report.studentName || 'Unknown Reporter',
    reporterContact: report.studentPhone || 'Not provided',
    reporterEmail: report.studentEmail,
    reporterMatricNo: report.studentMatrix,
    reporter_type_display: report.reporter_type_display,
    reporter_type: report.reporter_type,
    description: report.description,
    incidentCategory: report.incidentCategory,
    injuries: report.injuries,
    officerNotes: report.officerNotes,
    assignedOfficer: report.assignedOfficer,
    officerName: report.officerName,
    attachmentUrls: report.attachmentUrls,
    incidentDateTime: report.incidentDateTime,
    reportedAt: report.reportedAt,
    studentName: report.studentName,
    studentEmail: report.studentEmail,
    studentPhone: report.studentPhone,
    studentMatrix: report.studentMatrix
  }));

  return (
    <DashboardLayout>
      {/* Emergency Alert Banner - Add this back if you have it */}
      {/* <EmergencyAlertBanner /> */}

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
