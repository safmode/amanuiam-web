// Extended officer data for V3
export const mockOfficersV3 = [
  {
    id: 'OFF-001',
    name: 'Pegawai Razak bin Ahmad',
    rank: 'Senior Security Officer',
    department: 'Operations',
    phone: '+60123456789',
    status: 'on_duty',
    casesHandled: 156,
    responseRate: 98,
  },
  {
    id: 'OFF-002',
    name: 'Pegawai Yusof bin Hassan',
    rank: 'Security Officer',
    department: 'Operations',
    phone: '+60145678901',
    status: 'on_duty',
    casesHandled: 72,
    responseRate: 92,
  },
  {
    id: 'OFF-003',
    name: 'Pegawai Kamal bin Ismail',
    rank: 'Junior Officer',
    department: 'Operations',
    phone: '+60167890123',
    status: 'off_duty',
    casesHandled: 45,
    responseRate: 88,
  },
  {
    id: 'OFF-004',
    name: 'Pegawai Liyana binti Abdul',
    rank: 'Senior Security Officer',
    department: 'Operations',
    phone: '+60123456789',
    status: 'responding',
    casesHandled: 89,
    responseRate: 95,
  },
  {
    id: 'OFF-005',
    name: 'Pegawai Aminah binti Osman',
    rank: 'Security Officer',
    department: 'Operations',
    phone: '+60156789012',
    status: 'on_duty',
    casesHandled: 234,
    responseRate: 99,
  },
];

// Helper function to generate random dates in January 2025
const generateDate = (dayRange) => {
  const day = Math.floor(Math.random() * dayRange) + 1;
  return `2025-01-${day.toString().padStart(2, '0')}`;
};

// Helper function to generate random time
const generateTime = () => {
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 60);
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

// Base reports (first 5 from your original data)
const baseReports = [
  {
    id: 'RPT-2025-001',
    reporterName: 'Ahmad bin Abdullah',
    reporterContact: '+60123456789',
    reporterMatricNo: '2012345',
    category: 'theft_robbery',
    issue: 'Theft/Robbery',
    description: 'Laptop stolen from study room',
    date: '2025-01-15',
    time: '14:30',
    location: 'Mahallah Halimatul Saadiah, Level 2 Study Room',
    mahallah: 'Mahallah Halimatul Saadiah',
    coordinates: { lat: 3.2516, lng: 101.7321 },
    damages: 'Laptop worth RM3,500',
    injuries: 'None',
    suspectDescription: 'Unknown, no witnesses',
    attachments: ['/placeholder.svg'],
    status: 'in_progress',
    urgency: 'general',
    assignedOfficer: 'Pegawai Razak bin Ahmad',
    officerNotes: 'Checking CCTV footage',
    createdAt: '2025-01-15T14:35:00Z',
    updatedAt: '2025-01-15T16:00:00Z'
  },
  {
    id: 'RPT-2025-002',
    reporterName: 'Fatimah binti Hassan',
    reporterContact: '+60198765432',
    reporterMatricNo: '2034567',
    category: 'suspicious_activity',
    issue: 'Suspicious Activity',
    description: 'Suspicious individual loitering near parking area',
    date: '2025-01-15',
    time: '18:45',
    location: 'Mahallah Asiah, Parking Area B',
    mahallah: 'Mahallah Asiah',
    coordinates: { lat: 3.2520, lng: 101.7335 },
    damages: 'None',
    injuries: 'None',
    status: 'resolved',
    urgency: 'urgent',
    assignedOfficer: 'Pegawai Razak bin Ahmad',
    officerNotes: 'Individual identified and escorted off campus',
    resolvedAt: '2025-01-15T19:30:00Z',
    createdAt: '2025-01-15T18:47:00Z',
    updatedAt: '2025-01-15T19:30:00Z'
  },
  {
    id: 'RPT-2025-003',
    reporterName: 'Shafiqah binti Bibet',
    reporterContact: 'Hidden',
    category: 'harassment',
    issue: 'Harassment',
    description: 'Spotted an unknown male individual entering the female-only residential area through the side gate.',
    date: '2025-01-15',
    time: '23:15',
    location: 'Mahallah Ruqayyah, Side Gate',
    mahallah: 'Mahallah Ruqayyah',
    coordinates: { lat: 3.2512, lng: 101.7328 },
    suspectDescription: 'Male, approximately 25-30 years old, wearing dark clothing',
    status: 'pending',
    urgency: 'urgent',
    assignedOfficer: 'Pegawai Liyana binti Abdul',
    createdAt: '2025-01-15T23:17:00Z',
    updatedAt: '2025-01-15T23:17:00Z'
  },
  {
    id: 'RPT-2025-004',
    reporterName: 'Nurul Ain binti Ismail',
    reporterContact: '+60112233445',
    reporterMatricNo: '2045678',
    category: 'fire_hazard',
    issue: 'Fire Hazard',
    description: 'A student left cooking unattended in the pantry, causing smoke to trigger the fire alarm.',
    date: '2025-01-14',
    time: '20:00',
    location: 'Mahallah Hafsa, Level 3 Pantry',
    mahallah: 'Mahallah Hafsa',
    damages: 'Minor smoke damage to ceiling',
    injuries: 'None',
    status: 'resolved',
    urgency: 'urgent',
    assignedOfficer: 'Pegawai Aminah binti Osman',
    officerNotes: 'Warning issued to student. Fire safety reminder sent to all residents.',
    resolvedAt: '2025-01-14T21:00:00Z',
    createdAt: '2025-01-14T20:05:00Z',
    updatedAt: '2025-01-14T21:00:00Z'
  },
  {
    id: 'RPT-2025-005',
    reporterName: 'Muhammad Hafiz',
    reporterContact: '+60187654321',
    reporterMatricNo: '2056789',
    category: 'vandalism',
    issue: 'Vandalism',
    description: 'Discovered vandalism near the main entrance of Mahallah Bilal.',
    date: '2025-01-13',
    time: '08:30',
    location: 'Mahallah Bilal, Main Entrance',
    mahallah: 'Mahallah Bilal',
    damages: 'Graffiti on wall approximately 2m x 1m',
    attachments: ['/placeholder.svg'],
    status: 'nfa',
    urgency: 'general',
    assignedOfficer: 'Pegawai Aminah binti Osman',
    officerNotes: 'Unable to identify perpetrator. Wall scheduled for repainting.',
    createdAt: '2025-01-13T08:35:00Z',
    updatedAt: '2025-01-14T10:00:00Z'
  },
];

// Generate additional 151 reports to reach 156 total
const generateAdditionalReports = () => {
  const categories = [
    { name: 'theft_robbery', issue: 'Theft/Robbery', weight: 30 },
    { name: 'harassment', issue: 'Harassment', weight: 20 },
    { name: 'vandalism', issue: 'Vandalism', weight: 15 },
    { name: 'fire_hazard', issue: 'Fire Hazard', weight: 10 },
    { name: 'suspicious_activity', issue: 'Suspicious Activity', weight: 15 },
    { name: 'facility_issue', issue: 'Facility Issue', weight: 8 },
    { name: 'other', issue: 'Other', weight: 2 }
  ];

  const mahallahList = [
    'Mahallah Hafsa',
    'Mahallah Asiah',
    'Mahallah Aminah',
    'Mahallah Ruqayyah',
    'Mahallah Halimatul Saadiah',
    'Mahallah Bilal',
    'Sports Complex',
    'KICT',
    'KOE'
  ];

  const statuses = [
    { name: 'resolved', weight: 98 },
    { name: 'in_progress', weight: 18 },
    { name: 'pending', weight: 23 },
    { name: 'nfa', weight: 17 }
  ];

  const urgencies = ['general', 'urgent'];
  const officers = mockOfficersV3.map(o => o.name);

  const reports = [];

  // Weighted random selection
  const getWeightedRandom = (items) => {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
      if (random < item.weight) {
        return item;
      }
      random -= item.weight;
    }
    return items[items.length - 1];
  };

  for (let i = 6; i <= 156; i++) {
    const category = getWeightedRandom(categories);
    const mahallah = mahallahList[Math.floor(Math.random() * mahallahList.length)];
    const status = getWeightedRandom(statuses);
    const urgency = urgencies[Math.floor(Math.random() * urgencies.length)];
    const officer = officers[Math.floor(Math.random() * officers.length)];
    const date = generateDate(15);
    const time = generateTime();

    const report = {
      id: `RPT-2025-${i.toString().padStart(3, '0')}`,
      reporterName: `Reporter ${i}`,
      reporterContact: '+601234567' + (i % 100).toString().padStart(2, '0'),
      reporterMatricNo: `20${i.toString().padStart(5, '0')}`,
      category: category.name,
      issue: category.issue,
      description: `${category.issue} incident reported at ${mahallah}`,
      date: date,
      time: time,
      location: `${mahallah}, Area ${String.fromCharCode(65 + (i % 5))}`,
      mahallah: mahallah,
      coordinates: {
        lat: 3.2516 + (Math.random() * 0.01 - 0.005),
        lng: 101.7321 + (Math.random() * 0.01 - 0.005)
      },
      damages: category.name === 'theft_robbery' ? 'Items missing' : category.name === 'vandalism' ? 'Property damage' : category.name === 'facility_issue' ? 'Facility damage' : 'None',
      injuries: 'None',
      status: status.name,
      urgency: urgency,
      assignedOfficer: officer,
      officerNotes: status.name === 'resolved' ? 'Case resolved successfully' : status.name === 'in_progress' ? 'Investigation ongoing' : status.name === 'nfa' ? 'No further action required' : 'Pending review',
      createdAt: `${date}T${time}:00Z`,
      updatedAt: `${date}T${time}:00Z`
    };

    if (status.name === 'resolved') {
      report.resolvedAt = `${date}T${time}:00Z`;
    }

    reports.push(report);
  }

  return reports;
};

// Combine base reports with generated reports
export const mockReportsV3 = [...baseReports, ...generateAdditionalReports()];

export const mockEmergencyAlertsV3 = [
  {
    id: 'EMRG-001',
    type: 'panic_button',
    reporterName: 'Aisyah binti Omar',
    reporterContact: '+60134567890',
    location: 'Mahallah Asiah, Block B Level 4',
    coordinates: { lat: 3.2518, lng: 101.7330 },
    triggeredAt: '2025-01-16T06:30:00Z',
    status: 'active'
  },
  {
    id: 'EMRG-002',
    type: 'panic_button',
    reporterName: 'Ahmad bin Abdullah',
    reporterContact: '+60348976576',
    location: 'Mahallah Ruqayyah, Block D Level 1',
    coordinates: { lat: 3.2512, lng: 101.7328 },
    triggeredAt: '2025-01-16T06:30:00Z',
    status: 'responding'
  }
];

export const mockStatsV3 = {
  totalReports: 156,
  pendingReports: 23,
  inProgressReports: 18,
  resolvedReports: 98,
  nfaReports: 17,
  emergencyAlerts: 2,
  averageResponseTime: '12 min',
  weeklyReports: 34
};

// Hotspot data matching the prototype
export const hotspotDataV3 = [
  {
    id: 1,
    location: 'Mahallah Hafsah Parking',
    lat: 3.2478,
    lng: 101.7298,
    incidents: 12,
    topIncident: 'Theft/Robbery',
    topCount: 8,
    riskLevel: 'high',
    breakdown: { 'Theft/Robbery': 8, 'Vandalism': 3, 'Suspicious Activity': 1 }
  },
  {
    id: 2,
    location: 'Mahallah Hafsah',
    lat: 3.2475,
    lng: 101.7295,
    incidents: 9,
    topIncident: 'Theft/Robbery',
    topCount: 5,
    riskLevel: 'moderate',
    breakdown: { 'Theft/Robbery': 5, 'Harassment': 3, 'Facility Issue': 1 }
  },
  {
    id: 3,
    location: 'Sports Complex',
    lat: 3.2455,
    lng: 101.7335,
    incidents: 15,
    topIncident: 'Suspicious Activity',
    topCount: 11,
    riskLevel: 'high',
    breakdown: { 'Suspicious Activity': 11, 'Harassment': 3, 'Other': 1 }
  },
  {
    id: 4,
    location: 'Mahallah Aminah',
    lat: 3.2490,
    lng: 101.7318,
    incidents: 5,
    topIncident: 'Harassment',
    topCount: 3,
    riskLevel: 'low',
    breakdown: { 'Harassment': 3, 'Theft/Robbery': 1, 'Facility Issue': 1 }
  },
  {
    id: 5,
    location: 'KICT',
    lat: 3.2528,
    lng: 101.7298,
    incidents: 7,
    topIncident: 'Suspicious Activity',
    topCount: 5,
    riskLevel: 'moderate',
    breakdown: { 'Suspicious Activity': 5, 'Theft/Robbery': 2 }
  },
  {
    id: 6,
    location: 'KOE',
    lat: 3.2548,
    lng: 101.7368,
    incidents: 6,
    topIncident: 'Theft/Robbery',
    topCount: 3,
    riskLevel: 'moderate',
    breakdown: { 'Theft/Robbery': 3, 'Vandalism': 2, 'Fire Hazard': 1 }
  },
  {
    id: 7,
    location: 'Mahallah Hafsah Backgate',
    lat: 3.2465,
    lng: 101.7285,
    incidents: 4,
    topIncident: 'Harassment',
    topCount: 2,
    riskLevel: 'low',
    breakdown: { 'Harassment': 2, 'Theft/Robbery': 1, 'Other': 1 }
  },
];

// Weekly chart data - updated to reflect more realistic numbers
export const weeklyChartData = [
  { day: 'Mon', reports: 18, resolved: 15 },
  { day: 'Tue', reports: 25, resolved: 21 },
  { day: 'Wed', reports: 28, resolved: 23 },
  { day: 'Thu', reports: 22, resolved: 19 },
  { day: 'Fri', reports: 30, resolved: 25 },
  { day: 'Sat', reports: 20, resolved: 17 },
  { day: 'Sun', reports: 13, resolved: 11 },
];

// Category distribution (percentages based on 156 reports)
export const categoryDistribution = [
  { name: 'Theft/Robbery', value: 30, color: '#D4A853' },
  { name: 'Harassment', value: 20, color: '#EF4444' },
  { name: 'Vandalism', value: 15, color: '#8B5CF6' },
  { name: 'Suspicious Activity', value: 15, color: '#3B9B8C' },
  { name: 'Fire Hazard', value: 10, color: '#F59E0B' },
  { name: 'Facility Issue', value: 8, color: '#5B8DEE' },
  { name: 'Other', value: 2, color: '#6B7280' },
];

// Monthly trend data - showing growth to 156 total
export const monthlyTrendData = [
  { month: 'Jan', incidents: 156 },
  { month: 'Feb', incidents: 142 },
  { month: 'Mar', incidents: 128 },
  { month: 'Apr', incidents: 135 },
  { month: 'May', incidents: 148 },
  { month: 'Jun', incidents: 152 },
  { month: 'Jul', incidents: 165 },
  { month: 'Aug', incidents: 159 },
  { month: 'Sep', incidents: 170 },
  { month: 'Oct', incidents: 178 },
  { month: 'Nov', incidents: 185 },
  { month: 'Dec', incidents: 192 },
];

// Incidents by Mahallah - updated with more realistic distribution
export const incidentsByMahallah = [
  { name: 'Mahallah Hafsa', count: 28, color: '#3B9B8C' },
  { name: 'Mahallah Asiah', count: 35, color: '#3B9B8C' },
  { name: 'Mahallah Aminah', count: 42, color: '#F59E0B' },
  { name: 'Sports Complex', count: 51, color: '#EF4444' },
];

// Response time by hour
export const responseTimeByHour = [
  { hour: '00:00', time: 8 },
  { hour: '04:00', time: 6 },
  { hour: '08:00', time: 12 },
  { hour: '12:00', time: 15 },
  { hour: '16:00', time: 18 },
  { hour: '20:00', time: 14 },
];
