import api from "./axios";


export const checkIn = ({ qrPayload, latitude, longitude, note }) =>
  api.post("/entry/checkin", {
    qrPayload,
    latitude,
    longitude,
    ...(note && { note }),
  });

export const checkOut = () => api.post("/entry/checkout");
export const getMyStatus = () => api.get("/entry/my-status").then((r) => r.data);
export const getMyLogs = () => api.get("/entry/my-logs").then((r) => r.data);
export const getLiveOccupancy = (gymId) =>
  api.get(`/entry/live-count/${gymId}`).then((r) => r.data);
export const getMyGymLocation = () =>
  api.get("/entry/my-gym-location").then((r) => r.data);
export const getMyStreak = () => api.get("/streaks/me").then((r) => r.data);
export const getStreakHistory = () =>
  api.get("/streaks/me/history").then((r) => r.data);
