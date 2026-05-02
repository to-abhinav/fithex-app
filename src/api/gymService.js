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
