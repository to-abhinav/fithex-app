import api from "./axios";

export const getNearbyGyms = ({ longitude, latitude, radius = 10 }) =>
  api
    .get("/gyms/nearby", { params: { longitude, latitude, radius } })
    .then((r) => r.data);

export const searchGyms = ({ q, city }) =>
  api
    .get("/gyms/search", { params: { q, city } })
    .then((r) => r.data);


export const getGymById = (id) =>
  api.get(`/gyms/${id}`).then((r) => r.data);

// ── Public plans for a gym ─────────────────────────────────────────────────

export const getGymPlans = (gymId) =>
  api.get(`/plans/gym/${gymId}`).then((r) => r.data);

// ── Owner-side gym management ──────────────────────────────────────────────

export const getMyGym = () =>
  api.get("/gyms/owner/mine").then((r) => r.data);

export const createGym = (data) =>
  api.post("/gyms/create-gym", data).then((r) => r.data);

export const updateGym = (id, data) =>
  api.put(`/gyms/${id}`, data).then((r) => r.data);

export const updateGymImages = (id, formData) =>
  api
    .put(`/gyms/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

export const addGalleryImages = (id, formData) =>
  api
    .put(`/gyms/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

export const updateTimings = (id, timings) =>
  api.put(`/gyms/${id}/timings`, { timings }).then((r) => r.data);

export const toggleGymStatus = (id) =>
  api.put(`/gyms/${id}/toggle-status`).then((r) => r.data);

export const deleteGym = (id) =>
  api.delete(`/gyms/${id}`).then((r) => r.data);
