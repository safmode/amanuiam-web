// Dashboard.jsx - Fixed to preserve location data
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import { RecentReports } from '@/components/dashboard/RecentReports';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { HeatmapPreview } from '@/components/dashboard/HeatmapPreview';
import { ReportDetailsModal } from '@/components/dashboard/ReportsDetailsModal';
import { AddReport } from '@/components/dashboard/AddReport';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Send, BarChart3, Users } from 'lucide-react';
import { router } from '@inertiajs/react';

const Dashboard = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddReportOpen, setIsAddReportOpen] = useState(false);

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

  // Helper: get CSRF token from meta tag
  const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  };

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white text-sm animate-in slide-in-from-bottom-2 ${
      type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Fetch dashboard data (reports & stats)
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/dashboard/recent-data');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      console.log('Raw API response:', data); // Debug log
      console.log('Recent reports sample:', data.recentReports?.[0]); // Debug log

      setRecentReports(data.recentReports || []);
      setStats({
        totalReports: data.stats?.totalReports || 0,
        pendingReports: data.stats?.pendingReports || 0,
        inProgressReports: data.stats?.inProgressReports || 0,
        resolvedReports: data.stats?.resolvedReports || 0,
        nfaReports: data.stats?.nfaReports || 0,
        emergencyAlerts: data.stats?.emergencyAlerts || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch hotspot data
  const fetchHotspotData = async () => {
    try {
      const response = await fetch('/heatmap-data');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setHotspots(data.hotspots || []);
    } catch (error) {
      console.error('Error fetching hotspot data:', error);
      if (recentReports.length > 0) {
        const generated = generateHotspotsFromReports(recentReports);
        setHotspots(generated);
      }
    }
  };

  const generateHotspotsFromReports = (reports) => {
    const map = new Map();
    reports.forEach(report => {
      const loc = report.locationArea || report.mahallah;
      if (!loc) return;
      if (!map.has(loc)) map.set(loc, { location: loc, incidents: 0, breakdown: {} });
      const hotspot = map.get(loc);
      hotspot.incidents++;
      const cat = report.incidentCategory || 'other';
      hotspot.breakdown[cat] = (hotspot.breakdown[cat] || 0) + 1;
    });
    return Array.from(map.values()).sort((a,b) => b.incidents - a.incidents).slice(0,5);
  };

  // ✅ CREATE REPORT - Using the correct endpoint '/Reports'
  const createReport = async (reportData) => {
    try {
      const response = await fetch('/Reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
          'Accept': 'application/json'
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `Server responded with ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.message || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
      }

      const result = await response.json();
      showToast('✅ Report created successfully!', 'success');

      // Refresh data
      await fetchDashboardData();
      await fetchHotspotData();

      return result;
    } catch (error) {
      console.error('Create report error:', error);
      showToast(error.message || 'Failed to create report', 'error');
      throw error;
    }
  };

  const handleCreateReport = async (payload) => {
    await createReport(payload);
  };

  useEffect(() => {
    fetchDashboardData();
    fetchHotspotData();
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchHotspotData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleReportUpdate = () => {
    fetchDashboardData();
    fetchHotspotData();
  };

  // FIXED: Preserve ALL report data including locationRaw
  const formattedReports = recentReports.map(report => ({
    // Keep all original data
    ...report,  // This spreads all original fields including locationRaw, locationArea, building, etc.

    // Add/override specific fields for display
    id: report.reportId,
    issue: report.description?.substring(0, 100) + (report.description?.length > 100 ? '...' : ''),
    date: report.incidentDateTime ? new Date(report.incidentDateTime).toLocaleDateString() : 'Unknown',
    time: report.incidentDateTime ? new Date(report.incidentDateTime).toLocaleTimeString() : 'Unknown',
  }));

  console.log('Formatted reports sample:', formattedReports[0]); // Debug log

  return (
    <DashboardLayout>
      <StatsOverview stats={stats} loading={loading} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentReports
            reports={formattedReports.slice(0,5)}
            onViewReport={handleViewReport}
            loading={loading}
          />
        </div>
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-800">
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
                <Button variant="outline" className="h-auto py-3 px-3 flex flex-col items-center gap-1.5" onClick={() => router.visit('/Alerts')}>
                  <Send className="w-4 h-4" />
                  <span className="text-xs font-medium">Send Alert</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 px-3 flex flex-col items-center gap-1.5" onClick={() => router.visit('/Statistics')}>
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-xs font-medium">Statistics</span>
                </Button>
                <Button variant="outline" className="h-auto py-3 px-3 flex flex-col items-center gap-1.5" onClick={() => router.visit('/Officers')}>
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-medium">View Officer</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          <HeatmapPreview hotspots={hotspots} />
        </div>
      </div>
      <ReportDetailsModal
        report={selectedReport}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleReportUpdate}
      />
      <AddReport
        isOpen={isAddReportOpen}
        onClose={() => setIsAddReportOpen(false)}
        onSave={handleCreateReport}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
