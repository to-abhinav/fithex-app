import api from "./axios";

// Member side request status 
export const getMyRequest = () =>
  api.get("/requests/mine").then((r) => r.data);

export const cancelMyRequest = (id) =>
  api.put(`/requests/${id}/cancel`).then((r) => r.data);



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


export const getGymPlans = (gymId) =>
  api.get(`/plans/gym/${gymId}`).then((r) => r.data);


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

export const saveRazorpayCredentials = (gymId, razorpayKeyId, razorpayKeySecret) =>
  api.post(`/gyms/${gymId}/razorpay`, { razorpayKeyId, razorpayKeySecret })
    .then((r) => r.data);

export const getRazorpayStatus = (gymId) =>
  api.get(`/gyms/${gymId}/razorpay-status`).then((r) => r.data);

export const createLinkedAccount = ({ gst } = {}) =>
  api.post("/gyms/create-linked-account", { gst }).then((r) => r.data);

export const createStakeholder = ({ pan, ownerName }) =>
  api.post("/gyms/create-stakeholder", { pan, ownerName }).then((r) => r.data);

export const requestProductConfig = () =>
  api.post("/gyms/request-product-config").then((r) => r.data);

export const updateProductConfig = ({ ifsc_code, account_number, beneficiary_name }) =>
  api.patch("/gyms/update-product-config", { ifsc_code, account_number, beneficiary_name }).then((r) => r.data);
