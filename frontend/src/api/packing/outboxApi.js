import api from "../api.js";

export const getBoxLabelModels = () => api.get("/packing/box-label/models");

export const createBoxLabel = (payload) => api.post("/packing/box-label", payload);

export const getBoxLabelTemplate = (type, density) =>
  api.get(`/packing/box-label/template/${type}`, {
    params: { density },
  });

// Sinh SDC Outbox QR Code (30 chars)
export const generateSdcOutboxQr = async (payload) => {
  return await api.post("/packing/outbox/generate-outbox-qr", payload);
};

// Sinh Goodix Outbox QR Code
export const generateGoodixOutboxQr = async (payload) => {
  return await api.post("/packing/outbox/generate-outbox-qr", payload);
};

// Lưu thông tin Goodix Outbox
export const saveGoodixOutbox = async (payload) => {
  return await api.post("/packing/outbox/save-outbox", payload);
};

// Tra cứu danh sách  Outbox theo bộ lọc + phân trang
export const searchGoodixOutbox = async (params) => {
  return await api.get("/packing/outbox/search", { params });
};

