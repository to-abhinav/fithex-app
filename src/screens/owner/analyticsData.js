
const MONTH_DATA = {
  revenue: { thisMonth: 45000, allTime: 320000, currency: 'INR' },
  members: {
    active: 87, inactive: 14, total: 101,
    retentionRate: 86.1, newThisMonth: 12, churnedThisMonth: 3,
  },
  planBreakdown: [
    { _id: '1', planName: 'Premium Monthly', count: 45 },
    { _id: '2', planName: 'Basic Monthly', count: 28 },
    { _id: '3', planName: 'Quarterly Pro', count: 9 },
    { _id: '4', planName: 'Annual Elite', count: 5 },
  ],
  peakHours: [
    { hour: '06:00', checkIns: 18 }, { hour: '07:00', checkIns: 34 },
    { hour: '08:00', checkIns: 27 }, { hour: '09:00', checkIns: 15 },
    { hour: '10:00', checkIns: 8 },  { hour: '11:00', checkIns: 5 },
    { hour: '12:00', checkIns: 10 }, { hour: '13:00', checkIns: 7 },
    { hour: '14:00', checkIns: 4 },  { hour: '15:00', checkIns: 6 },
    { hour: '16:00', checkIns: 14 }, { hour: '17:00', checkIns: 22 },
    { hour: '18:00', checkIns: 31 }, { hour: '19:00', checkIns: 28 },
    { hour: '20:00', checkIns: 19 }, { hour: '21:00', checkIns: 11 },
  ],
  dailyRevenue: [
    { day: 'Mon', amount: 6200 }, { day: 'Tue', amount: 5800 },
    { day: 'Wed', amount: 7100 }, { day: 'Thu', amount: 4900 },
    { day: 'Fri', amount: 8200 }, { day: 'Sat', amount: 9500 },
    { day: 'Sun', amount: 3300 },
  ],
  revenueByPlan: [
    { planName: 'Premium Monthly', revenue: 22500 },
    { planName: 'Basic Monthly', revenue: 11200 },
    { planName: 'Quarterly Pro', revenue: 7200 },
    { planName: 'Annual Elite', revenue: 4100 },
  ],
  memberGrowth: [
    { month: 'Nov', count: 62 }, { month: 'Dec', count: 68 },
    { month: 'Jan', count: 74 }, { month: 'Feb', count: 79 },
    { month: 'Mar', count: 88 }, { month: 'Apr', count: 101 },
  ],
  renewalVsChurn: [
    { month: 'Nov', renewed: 8, churned: 2 },
    { month: 'Dec', renewed: 10, churned: 4 },
    { month: 'Jan', renewed: 12, churned: 3 },
    { month: 'Feb', renewed: 9, churned: 2 },
    { month: 'Mar', renewed: 14, churned: 5 },
    { month: 'Apr', renewed: 11, churned: 3 },
  ],
  attendanceHeatmap: (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    const base = [
      [3,8,7,4,2,1,2,1,1,1,3,5,7,6,4,2],
      [2,7,6,3,2,1,3,2,1,2,4,6,8,7,5,3],
      [4,9,8,5,3,1,2,1,1,1,3,5,7,6,4,2],
      [3,7,6,4,2,1,2,1,1,2,4,6,9,8,5,3],
      [5,8,7,4,3,2,3,2,1,2,5,7,8,7,5,3],
      [6,9,8,6,4,3,4,3,2,3,5,6,6,5,3,1],
      [4,6,5,3,2,1,2,1,1,1,2,3,4,3,2,1],
    ];
    const result = [];
    days.forEach((day, di) => {
      hours.forEach((hour, hi) => {
        result.push({ day, hour, intensity: base[di][hi] });
      });
    });
    return result;
  })(),
  topMembers: [
    { _id: '1', name: 'Rahul Sharma', checkIns: 28, initials: 'RS' },
    { _id: '2', name: 'Priya Patel', checkIns: 26, initials: 'PP' },
    { _id: '3', name: 'Arjun Kapoor', checkIns: 24, initials: 'AK' },
    { _id: '4', name: 'Sneha Gupta', checkIns: 22, initials: 'SG' },
    { _id: '5', name: 'Vikram Singh', checkIns: 20, initials: 'VS' },
  ],
};

// 7-day sliced data
const WEEK_DATA = {
  ...MONTH_DATA,
  revenue: { thisMonth: 12400, allTime: 320000, currency: 'INR' },
  members: {
    ...MONTH_DATA.members,
    newThisMonth: 3, churnedThisMonth: 1, retentionRate: 89.2,
  },
  dailyRevenue: MONTH_DATA.dailyRevenue,
  revenueByPlan: [
    { planName: 'Premium Monthly', revenue: 6200 },
    { planName: 'Basic Monthly', revenue: 3100 },
    { planName: 'Quarterly Pro', revenue: 2000 },
    { planName: 'Annual Elite', revenue: 1100 },
  ],
};

// 3-month data
const QUARTER_DATA = {
  ...MONTH_DATA,
  revenue: { thisMonth: 128000, allTime: 320000, currency: 'INR' },
  members: {
    ...MONTH_DATA.members,
    newThisMonth: 32, churnedThisMonth: 10, retentionRate: 84.5,
  },
  revenueByPlan: [
    { planName: 'Premium Monthly', revenue: 64000 },
    { planName: 'Basic Monthly', revenue: 33600 },
    { planName: 'Quarterly Pro', revenue: 19200 },
    { planName: 'Annual Elite', revenue: 11200 },
  ],
};

export const DATA_BY_PERIOD = {
  '7d': WEEK_DATA,
  '30d': MONTH_DATA,
  '3m': QUARTER_DATA,
};

export const PERIOD_LABELS = {
  '7d': 'Last 7 Days',
  '30d': 'This Month',
  '3m': 'Last 3 Months',
};
