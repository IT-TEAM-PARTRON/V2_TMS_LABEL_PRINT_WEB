import api from "../api.js";

// Tra cứu 1 tem đã in trước đó theo mã đã quét (barcode/QR)
export const lookupReprintLabel = (code, density) =>
  api.post("/packing/reprint/lookup", { code, density });

// Ghi log audit cho 1 lần in lại tem
export const logReprint = (code) =>
  api.post("/packing/reprint/log", { code });
