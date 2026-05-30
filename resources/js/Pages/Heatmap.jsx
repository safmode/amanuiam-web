import { useState, useEffect, useRef, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Calendar, MapPin, BarChart3, ChevronDown, Filter, X, Frown, Layers } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet.heat';


let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Heatmap Layer Component - with show/hide control
const HeatmapLayer = ({ points, show }) => {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    // Clean up previous layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // Only create if we have points AND show is true
    if (!show || !points || points.length === 0) {
      return;
    }

    // Check if L.heatLayer is available (it should be from the import)
    if (typeof L.heatLayer !== 'function') {
      console.error('L.heatLayer is not available. Make sure leaflet.heat is imported correctly.');
      return;
    }

    // Format points for leaflet.heat: [lat, lng, intensity]
    const heatPoints = points.map(point => [point.lat, point.lng, point.intensity || 0.5]);

    // Create and add heat layer
    heatLayerRef.current = L.heatLayer(heatPoints, {
      radius: 35,
      blur: 15,
      maxZoom: 17,
      minOpacity: 0.4,
      gradient: {
        0.0: '#22c55e',  // Green starts at 0
        0.33: '#22c55e', // Green stays until 33%
        0.34: '#f59e0b', // Yellow/Amber from 34-66%
        0.66: '#f59e0b',
        0.67: '#ef4444', // Red from 67-100%
        1.0: '#ef4444'
      }
    }).addTo(map);

    // Cleanup on unmount or when show changes
    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [points, map, show]); // Re-run when points, map, or show changes

  return null;
};

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
}

// Simple Dropdown Component
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

const IIUM_CENTER = [3.2510, 101.7355];

const Heatmap = () => {
  const { hotspots: hotspotsData = [] } = usePage().props;
  console.log('Received hotspots:', hotspotsData);
  console.log('Google API Key exists?', !!usePage().props.googleApiKey);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [filteredHotspotsData, setFilteredHotspotsData] = useState(hotspotsData);
  const [filters, setFilters] = useState({
    category: [],
  });
  const [showHeatmap, setShowHeatmap] = useState(true); // New state for heatmap toggle

  // Generate heatmap points from filtered hotspots
  const heatmapPoints = useMemo(() => {
    const points = [];
    if (filteredHotspotsData.length === 0) return points;

    const maxIncidents = Math.max(...filteredHotspotsData.map(h => h.incidents), 1);
    const minIncidents = Math.min(...filteredHotspotsData.map(h => h.incidents), 0);

    filteredHotspotsData.forEach(hotspot => {
        if (hotspot.lat && hotspot.lng) {
        // Better intensity calculation that spreads values
        let intensity;
        if (maxIncidents === minIncidents) {
            intensity = 0.5;
        } else {
            // Normalize between 0.1 and 1.0
            intensity = 0.1 + ((hotspot.incidents - minIncidents) / (maxIncidents - minIncidents)) * 0.9;
        }

        points.push({
            lat: hotspot.lat,
            lng: hotspot.lng,
            intensity: intensity,
        });

        // Add scatter points for better heat distribution
        const scatterCount = Math.min(Math.floor(hotspot.incidents / 2), 10);
        for (let i = 0; i < scatterCount; i++) {
            const latOffset = (Math.random() - 0.5) * 0.0008;
            const lngOffset = (Math.random() - 0.5) * 0.0008;
            const scatterIntensity = Math.max(0.05, intensity * (0.2 + Math.random() * 0.3));

            points.push({
            lat: hotspot.lat + latOffset,
            lng: hotspot.lng + lngOffset,
            intensity: scatterIntensity,
            });
        }
        }
    });

    return points;
  }, [filteredHotspotsData]);

  // Set initial selected location when data loads
  useEffect(() => {
    if (filteredHotspotsData.length > 0 && !selectedLocation) {
      setSelectedLocation(filteredHotspotsData[0]);
    }
  }, [filteredHotspotsData]);

  // Update filtered data when hotspotsData changes from server
  useEffect(() => {
    setFilteredHotspotsData(hotspotsData);
  }, [hotspotsData]);

  const toggleFilter = (filterType, value) => {
    setFilters(prev => {
      const current = prev[filterType];
      const exists = current.includes(value);
      return {
        ...prev,
        [filterType]: exists
          ? current.filter(v => v !== value)
          : [...current, value],
      };
    });
  };

  const clearAllFilters = () => {
    setFilters({ category: [] });
    setDateFilter('all');
    setCustomDateFrom('');
    setCustomDateTo('');
    applyFilters('all');
  };

  const getDateRange = (filter) => {
    const today = new Date();
    let dateFrom = '';
    let dateTo = '';

    if (filter === 'today') {
        dateFrom = today.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
    } else if (filter === 'week') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
        dateFrom = startOfWeek.toISOString().split('T')[0];
        dateTo = endOfWeek.toISOString().split('T')[0];
    } else if (filter === 'month') {
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 2).toISOString().split('T')[0];
        dateTo = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0];
    } else if (filter === 'custom') {
        dateFrom = customDateFrom;
        dateTo = customDateTo;
    }

    return { dateFrom, dateTo };
  };

  const applyFilters = (filter = dateFilter) => {
    setIsLoading(true);
    const { dateFrom, dateTo } = getDateRange(filter);

    router.get(
      '/Heatmap',
      {
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      },
      {
        preserveState: true,
        replace: true,
        onSuccess: (page) => {
          setFilteredHotspotsData(page.props.hotspots || []);
          setIsLoading(false);
        },
        onError: () => setIsLoading(false),
      }
    );
    setShowDateDropdown(false);
  };

  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    if (filter !== 'custom') {
      applyFilters(filter);
    }
    setShowDateDropdown(false);
  };

  const applyCustomDateRange = () => {
    if (customDateFrom && customDateTo) {
      setDateFilter('custom');
      applyFilters('custom');
      setShowDateDropdown(false);
    }
  };

  const clearCustomDateRange = () => {
    setCustomDateFrom('');
    setCustomDateTo('');
    setDateFilter('all');
    applyFilters('all');
    setShowDateDropdown(false);
  };

  // Filter hotspots based on category
  const displayHotspots = (() => {
    if (filters.category.length === 0) {
      return filteredHotspotsData;
    }
    return filteredHotspotsData.filter(h =>
      h.breakdown && Object.keys(h.breakdown).some(cat => filters.category.includes(cat))
    );
  })();

  const getRiskColor = (level) =>
    level === 'high' ? 'bg-red-500' : level === 'moderate' ? 'bg-amber-500' : 'bg-green-500';

  const getCircleColor = (level) =>
    level === 'high' ? '#ef4444' : level === 'moderate' ? '#f59e0b' : '#22c55e';

  const getCircleFill = (level) =>
    level === 'high' ? '#ef444480' : level === 'moderate' ? '#f59e0b80' : '#22c55e80';

  const getRiskLabel = (level) =>
    level === 'high' ? 'High Risk' : level === 'moderate' ? 'Moderate' : 'Low Risk';

  const maxIncidents = Math.max(...displayHotspots.map(h => h.incidents), 1);

  const getDateFilterLabel = () => {
    if (dateFilter === 'custom') {
      if (customDateFrom && customDateTo) {
        return `${customDateFrom} - ${customDateTo}`;
      }
      return 'Custom Range';
    }
    switch (dateFilter) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      default: return 'All Time';
    }
  };

  const hasActiveFilters = filters.category.length > 0 || dateFilter !== 'all';

  const EmptyState = ({ message, description }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 dark:bg-slate-700">
        <Frown className="w-10 h-10 text-gray-400 dark:text-gray-500" />
      </div>
      <h4 className="text-lg font-semibold text-gray-700 mb-2 dark:text-gray-300">{message}</h4>
      <p className="text-sm text-gray-500 max-w-md dark:text-gray-400">{description}</p>
    </div>
  );

  const hasNoData = displayHotspots.length === 0;

  return (
    <DashboardLayout title="Heatmap and Locations" subtitle="Visualize incident hotspots across campus">

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center dark:bg-black/50">
          <div className="bg-white rounded-lg p-4 shadow-lg dark:bg-slate-800">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A853]"></div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      {!hasNoData && (
        <Card className="bg-amber-50 border-amber-200 mb-6 dark:bg-amber-900/20 dark:border-amber-700">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 dark:text-amber-400" />
            <div>
              <p className="font-medium text-sm text-gray-800 dark:text-gray-200">How to Read This Map</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium">Heatmap colors</span> show incident density: <span className="text-green-500 font-medium">Green = Low</span>,{' '}
                <span className="text-amber-500 font-medium">Yellow/Amber = Moderate</span>,{' '}
                <span className="text-red-500 font-medium">Red = High risk</span>.{' '}
                Circle <span className="font-medium">size</span> reflects incident count — bigger means more incidents.{' '}
                Click any circle to see the breakdown.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Map Area */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-slate-800 border-border">
            <CardContent className="p-4">

              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                {/* Category Filter */}
                <SimpleDropdown
                  isOpen={showFilterDropdown}
                  onClose={() => setShowFilterDropdown(false)}
                  align="left"
                  trigger={
                    <Button
                      variant={filters.category.length > 0 ? "default" : "outline"}
                      className={`gap-2 rounded-xl relative ${filters.category.length > 0 ? 'bg-[#D4A853] hover:bg-[#C49A48] text-white' : 'border-gray-200 text-gray-700'} dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700`}
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    >
                      <Filter className="w-4 h-4" />
                      Category
                      {filters.category.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {filters.category.length}
                        </span>
                      )}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  }
                >
                  <div className="bg-white p-4 max-h-96 overflow-y-auto rounded-xl min-w-[240px] dark:bg-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Categories</Label>
                      {filters.category.length > 0 && (
                        <button
                          onClick={() => setFilters(prev => ({ ...prev, category: [] }))}
                          className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded dark:hover:bg-slate-700">
                          <input
                            type="checkbox"
                            checked={filters.category.includes(key)}
                            onChange={() => toggleFilter('category', key)}
                            className="rounded border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-700"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </SimpleDropdown>

                {/* Date Filter */}
                <SimpleDropdown
                  isOpen={showDateDropdown}
                  onClose={() => setShowDateDropdown(false)}
                  align="right"
                  trigger={
                    <Button
                      variant={dateFilter !== 'all' ? "default" : "outline"}
                      className={`gap-2 rounded-xl ${dateFilter !== 'all' ? 'bg-[#D4A853] hover:bg-[#C49A48] text-white' : 'border-gray-200 text-gray-700'} dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700`}
                      onClick={() => setShowDateDropdown(!showDateDropdown)}
                    >
                      <Calendar className="w-4 h-4" />
                      {getDateFilterLabel()}
                      {dateFilter !== 'all' && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          1
                        </span>
                      )}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  }
                >
                  <div className="bg-white p-4 rounded-xl min-w-[240px] dark:bg-slate-800">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Time Period</Label>
                          {dateFilter !== 'all' && dateFilter !== 'custom' && (
                            <button
                              onClick={() => handleDateFilterChange('all')}
                              className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <button
                            onClick={() => handleDateFilterChange('today')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              dateFilter === 'today' ? 'bg-[#D4A853] text-white' : 'hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-slate-700'
                            }`}
                          >
                            Today
                          </button>
                          <button
                            onClick={() => handleDateFilterChange('week')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              dateFilter === 'week' ? 'bg-[#D4A853] text-white' : 'hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-slate-700'
                            }`}
                          >
                            This Week
                          </button>
                          <button
                            onClick={() => handleDateFilterChange('month')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              dateFilter === 'month' ? 'bg-[#D4A853] text-white' : 'hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-slate-700'
                            }`}
                          >
                            This Month
                          </button>
                          <button
                            onClick={() => handleDateFilterChange('all')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              dateFilter === 'all' ? 'bg-[#D4A853] text-white' : 'hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-slate-700'
                            }`}
                          >
                            All Time
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 dark:border-slate-700" />

                      <div>
                        <Label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-200">Custom Range</Label>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-gray-500 mb-1 block dark:text-gray-400">From</Label>
                            <Input
                              type="date"
                              value={customDateFrom}
                              onChange={(e) => setCustomDateFrom(e.target.value)}
                              className="bg-gray-50 border-gray-200 rounded-lg text-sm h-9 text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500 mb-1 block dark:text-gray-400">To</Label>
                            <Input
                              type="date"
                              value={customDateTo}
                              onChange={(e) => setCustomDateTo(e.target.value)}
                              className="bg-gray-50 border-gray-200 rounded-lg text-sm h-9 text-gray-900 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              className="flex-1 rounded-lg border-gray-200 text-gray-700 dark:border-slate-700 dark:text-gray-300"
                              onClick={clearCustomDateRange}
                            >
                              Clear
                            </Button>
                            <Button
                              className="flex-1 bg-[#D4A853] hover:bg-[#C49A48] rounded-lg text-white"
                              onClick={applyCustomDateRange}
                              disabled={!customDateFrom || !customDateTo}
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SimpleDropdown>

                {/* Heatmap Toggle Button */}
                <Button
                  variant={showHeatmap ? "default" : "outline"}
                  className={`gap-2 rounded-xl ${showHeatmap ? 'bg-[#D4A853] hover:bg-[#C49A48] text-white' : 'border-gray-200 text-gray-700'} dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700`}
                  onClick={() => setShowHeatmap(!showHeatmap)}
                >
                  <Layers className="w-4 h-4" />
                  Heatmap {showHeatmap ? 'ON' : 'OFF'}
                </Button>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    className="gap-2 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                    onClick={clearAllFilters}
                  >
                    <X className="w-4 h-4" />
                    Clear All
                  </Button>
                )}
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {filters.category.map(cat => (
                    <Badge key={cat} variant="secondary" className="gap-1 px-2 py-1 bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600">
                      {categoryLabels[cat]}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => toggleFilter('category', cat)}
                      />
                    </Badge>
                  ))}
                  {dateFilter !== 'all' && (
                    <Badge variant="secondary" className="gap-1 px-2 py-1 bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600">
                      <Calendar className="w-3 h-3" />
                      {getDateFilterLabel()}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => handleDateFilterChange('all')}
                      />
                    </Badge>
                  )}
                </div>
              )}

              {/* Leaflet Map with Heatmap Layer - Toggleable */}
              <div className="rounded-xl border border-gray-200 overflow-hidden relative dark:border-slate-600" style={{ height: '500px', position: 'relative', zIndex: 0 }}>
                {hasNoData ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-slate-800">
                    <EmptyState
                      message="No Data Available"
                      description={dateFilter !== 'all'
                        ? `No incidents found for ${getDateFilterLabel().toLowerCase()}. Try changing the date range or clearing filters.`
                        : "No incident data found for the selected filters. Try adjusting your search criteria."}
                    />
                  </div>
                ) : (
                  <MapContainer
                    key="map-container"
                    center={IIUM_CENTER}
                    zoom={16}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                    zoomControl={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Heatmap Layer - Only shows when showHeatmap is true */}
                    {heatmapPoints.length > 0 && showHeatmap && (
                      <HeatmapLayer points={heatmapPoints} show={showHeatmap} />
                    )}

                    {/* Circle Markers */}
                    {displayHotspots
                      .filter((h) => h.lat != null && h.lng != null && !isNaN(h.lat) && !isNaN(h.lng))
                      .map((h) => (
                        <CircleMarker
                          key={h.id}
                          center={[h.lat, h.lng]}
                          radius={15 + (h.incidents / maxIncidents) * 20}
                          pathOptions={{
                            color: getCircleColor(h.riskLevel),
                            fillColor: getCircleFill(h.riskLevel),
                            fillOpacity: 0.6,
                            weight: 3,
                          }}
                          eventHandlers={{
                            click: () => setSelectedLocation(h),
                          }}
                        >
                          <Popup>
                            <div className="text-center min-w-[130px]">
                              <p className="font-bold text-sm">{h.location}</p>
                              <p className="text-xs text-gray-500 mt-1">{h.incidents} incidents</p>
                              <p className="text-xs mt-1">Top: {h.topIncident} ({h.topCount})</p>
                              <p className={`text-xs font-semibold mt-1 ${
                                h.riskLevel === 'high' ? 'text-red-500'
                                : h.riskLevel === 'moderate' ? 'text-amber-500'
                                : 'text-green-500'
                              }`}>
                                {getRiskLabel(h.riskLevel)}
                              </p>
                            </div>
                          </Popup>
                        </CircleMarker>
                      ))}
                  </MapContainer>
                )}
              </div>

              {/* Legend */}
              {!hasNoData && (
                <div className="mt-4 p-3 bg-gray-50 rounded-xl dark:bg-slate-700">
                  <p className="font-bold text-xs mb-3 uppercase tracking-wide text-gray-600 dark:text-gray-400">
                    Risk Level (By Incident Count)
                  </p>
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-red-500 rounded-2xl text-white text-xs flex items-center justify-center font-bold">&gt;70%</div>
                      <div>
                        <p className="font-medium text-sm text-red-500">High Risk</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Above 70% of max incidents</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-amber-500 rounded-2xl text-white text-xs flex items-center justify-center font-bold">&gt;40%</div>
                      <div>
                        <p className="font-medium text-sm text-amber-500">Moderate</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">40-70% of max incidents</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-green-500 rounded-2xl text-white text-xs flex items-center justify-center font-bold">&lt;40%</div>
                      <div>
                        <p className="font-medium text-sm text-green-500">Low Risk</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Under 40% of max</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-200 dark:border-slate-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Heatmap overlay shows incident density - greener = lower density, redder = higher concentration
                    </p>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Selected Location Card */}
          {selectedLocation && !hasNoData ? (
            <Card className="bg-white dark:bg-slate-800 border-border">
              <CardContent className="p-6">
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1 dark:text-gray-400">
                  <MapPin className="w-3 h-3" />
                  Selected Location
                </p>
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">{selectedLocation.location}</h3>
                <Badge className={`${getRiskColor(selectedLocation.riskLevel)} text-white mb-4`}>
                  {getRiskLabel(selectedLocation.riskLevel)}
                </Badge>
                <p className="text-3xl font-bold mb-1 text-gray-900 dark:text-gray-100">{selectedLocation.incidents}</p>
                <p className="text-sm text-gray-500 mb-4 dark:text-gray-400">total incidents reported</p>

                <div>
                  <p className="text-sm font-medium flex items-center gap-2 mb-2 text-gray-700 dark:text-gray-300">
                    <BarChart3 className="w-4 h-4" />
                    Incident Breakdown
                  </p>
                  {Object.entries(selectedLocation.breakdown || {}).map(([type, count]) => {
                    const percentage = Math.round((count / selectedLocation.incidents) * 100);
                    return (
                      <div key={type} className="flex flex-col gap-2 py-2 border-b last:border-0 border-gray-100 dark:border-slate-700">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{categoryLabels[type] || type}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{count} ({percentage}%)</span>
                        </div>
                        <Progress
                          value={percentage}
                          className="h-1.5 bg-gray-200 [&>div]:bg-[#D4A855] dark:bg-slate-600"
                        />
                      </div>
                    );
                  })}
                </div>

                <Button
                  className="w-full mt-4 bg-[#D4A853] hover:bg-[#C49A48] text-white"
                  onClick={() => (window.location.href = '/Reports')}
                >
                  View All Reports
                </Button>
              </CardContent>
            </Card>
          ) : (
            !hasNoData && (
              <Card className="bg-white dark:bg-slate-800 border-border">
                <CardContent className="p-6 text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3 dark:text-gray-600" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Click on any location marker to view details</p>
                </CardContent>
              </Card>
            )
          )}

          {/* Ranked List */}
          <Card className="bg-white dark:bg-slate-800 border-border">
            <CardContent className="p-6">
              <p className="text-sm font-medium flex items-center gap-2 mb-1 text-gray-700 dark:text-gray-300">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Ranked by Incidents
              </p>
              <p className="text-xs text-gray-500 mb-3 dark:text-gray-400">Click to view incident breakdown</p>

              {hasNoData ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No locations to display</p>
                  <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {displayHotspots
                    .slice()
                    .sort((a, b) => b.incidents - a.incidents)
                    .slice(0, 5)
                    .map((h, i) => (
                      <button
                        key={h.id}
                        onClick={() => setSelectedLocation(h)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors dark:hover:bg-slate-700 ${
                          selectedLocation?.id === h.id
                            ? 'bg-amber-50 border border-amber-200 dark:bg-slate-700 dark:border-amber-700'
                            : 'border border-transparent'
                        }`}
                      >
                        <span className="text-xs text-gray-500 w-5 dark:text-gray-400">#{i + 1}</span>
                        <div className={`${getRiskColor(h.riskLevel)} text-white w-8 h-8 rounded flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                          {h.incidents}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-100">{h.location}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Top: {h.topIncident} ({h.topCount})</p>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default Heatmap;
