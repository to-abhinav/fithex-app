import api from "./axios";

//  Membership Requests 
export const getGymRequests = (status) =>
  api
    .get("/requests/gym", { params: status ? { status } : {} })
    .then((r) => r.data);

export const approveRequest = (id) =>
  api.put(`/requests/${id}/approve`).then((r) => r.data);

export const rejectRequest = (id, rejectionReason) =>
  api
    .put(`/requests/${id}/reject`, { rejectionReason })
    .then((r) => r.data);

export const getMyPlans = () =>
  api.get("/plans/owner/mine").then((r) => r.data);

export const createPlan = (data) =>
  api.post("/plans/create", data).then((r) => r.data);

export const updatePlan = (id, data) =>
  api.put(`/plans/${id}`, data).then((r) => r.data);

export const togglePlan = (id) =>
  api.put(`/plans/${id}/toggle`).then((r) => r.data);

export const deletePlan = (id) =>
  api.delete(`/plans/${id}`).then((r) => r.data);

export const getGymReviews = (gymId, page = 1, limit = 10, sort = "newest") =>
  api
    .get(`/gyms/${gymId}/reviews`, { params: { page, limit, sort } })
    .then((r) => r.data);

export const replyToReview = (gymId, reviewId, text) =>
  api
    .post(`/gyms/${gymId}/reviews/${reviewId}/reply`, { text })
    .then((r) => r.data);

export const createAnnouncement = (title, message, category) =>
  api
    .post("/announcements", { title, message, category })
    .then((r) => r.data);

export const getMyAnnouncements = (page = 1, limit = 15) =>
  api
    .get("/announcements", { params: { page, limit } })
    .then((r) => r.data);

export const deleteAnnouncement = (id) =>
  api.delete(`/announcements/${id}`).then((r) => r.data);

export const createClosure = (date, reason, type) =>
  api
    .post("/closures", { date, reason, type })
    .then((r) => r.data);

export const getClosures = () =>
  api.get("/closures").then((r) => r.data);

export const deleteClosure = (date) =>
  api.delete(`/closures/${date}`).then((r) => r.data);

export const getGymLogs = (page = 1, limit = 50) =>
  api
    .get("/entry/gym-logs", { params: { page, limit } })
    .then((r) => r.data);

export const getTodayAttendance = () =>
  api.get("/entry/attendance").then((r) => r.data);

export const getGymPayments = (page = 1, limit = 20) =>
  api
    .get("/payments/gym", { params: { page, limit } })
    .then((r) => r.data);

export const getRevenueSummary = () =>
  api.get("/payments/revenue-summary").then((r) => r.data);

export const getAnalyticsDashboard = (period = "30d") =>
  api
    .get("/analytics/dashboard", { params: { period } })
    .then((r) => r.data);

export const getGymMembers = (page = 1, limit = 50) =>
  api
    .get("/requests/gym", { params: { status: "Approved", page, limit } })
    .then((r) => r.data);

export const getMemberEntryLogs = (memberId, limit = 30) =>
  api
    .get("/entry/gym-logs", { params: { userId: memberId, limit } })
    .then((r) => r.data);
    
export const renewMemberOffline = (memberId, planId, paymentMethod, amount) =>
  api
    .post("/requests/renew-offline", { memberId, planId, paymentMethod, amount })
    .then((r) => r.data);
