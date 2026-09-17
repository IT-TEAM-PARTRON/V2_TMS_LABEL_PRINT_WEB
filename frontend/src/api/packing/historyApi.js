import api from "../api.js";

export const searchPackingHistory = (params) =>
  api.get("/packing/history", { params });
