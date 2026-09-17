import api from "../api.js";

//======================= Model APIs =======================
export const getAllModels = () => {
  return api.get("/admin/models");
};

export const createModel = (data) => {
  return api.post("/admin/models", data);
};

export const updateModel = (id, data) => {
  return api.put(`/admin/models/${id}`, data);
};

export const deleteModel = (id) => {
  return api.delete(`/admin/models/${id}`);
};

//======================= ZPL Spec APIs =======================
export const getAllZplSpecs = () => {
  return api.get("/admin/zpls");
};

export const updateZplSpec = (id, data) => {
  return api.put(`/admin/zpls/${id}`, data);
};

export const getZplByType = (type) => {
  return api.get(`/admin/zpls/type/${type}`);
};

