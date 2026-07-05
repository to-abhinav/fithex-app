
export const ORANGE = {
  lightest: "rgba(251,191,36,0.15)",
  light: "#FCD34D",
  mid: "#F59E0B",
  core: "#F97316",
  dark: "#EA580C",
  darkest: "#C2410C",
};

export const OCCUPANCY_DATA = [
  { hour: "5 AM", pct: 15 },
  { hour: "6 AM", pct: 38 },
  { hour: "7 AM", pct: 82 },
  { hour: "8 AM", pct: 91 },
  { hour: "9 AM", pct: 70 },
  { hour: "10 AM", pct: 45 },
  { hour: "11 AM", pct: 40 },
  { hour: "12 PM", pct: 55 },
  { hour: "1 PM", pct: 52 },
  { hour: "2 PM", pct: 35 },
  { hour: "3 PM", pct: 30 },
  { hour: "4 PM", pct: 48 },
  { hour: "5 PM", pct: 75 },
  { hour: "6 PM", pct: 95 },
  { hour: "7 PM", pct: 90 },
  { hour: "8 PM", pct: 68 },
  { hour: "9 PM", pct: 42 },
  { hour: "10 PM", pct: 18 },
];

export const bucketLabel = (pct) => {
  if (pct >= 75) return { label: "Very Busy", color: "#EF4444" };
  if (pct >= 50) return { label: "Busy",     color: ORANGE.core  };
  if (pct >= 25) return { label: "Moderate", color: ORANGE.mid   };
  return              { label: "Quiet",    color: "#34d399" };
};

export const generateStreakData = () => {
  const data = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const rand = Math.random();
    let minutes = 0;
    if (rand > 0.45) {
      // visited
      if (rand > 0.85) minutes = 90 + Math.floor(Math.random() * 60); // 90-150 min
      else if (rand > 0.65) minutes = 60 + Math.floor(Math.random() * 30); // 60-90
      else minutes = 30 + Math.floor(Math.random() * 30); // 30-60
    }
    data.push({
      date: d.toISOString().split("T")[0],
      minutes,
      day: d.getDay(),
    });
  }
  return data;
};

export const STREAK_DATA = generateStreakData();

export const INITIAL_LOGS = [
  { id: 1, date: "Apr 15", entryTime: "7:02 AM", exitTime: "8:45 AM", duration: 103 },
  { id: 2, date: "Apr 14", entryTime: "6:50 AM", exitTime: "8:20 AM", duration: 90 },
  { id: 3, date: "Apr 13", entryTime: "7:15 AM", exitTime: "8:55 AM", duration: 100 },
  { id: 4, date: "Apr 11", entryTime: "7:00 AM", exitTime: "8:30 AM", duration: 90 },
  { id: 5, date: "Apr 10", entryTime: "7:30 AM", exitTime: "9:10 AM", duration: 100 },
];

export const SWIPE_TRACK_H = 56;
export const SWIPE_THUMB_SIZE = 48;
export const SWIPE_THRESHOLD = 0.78; // 78% of track to trigger exit
