import api from "../api/api.js";

// Biến global lưu trữ độ lệch thời gian (Offset)
let timeOffset = 0;

export const syncTimeWithServer = async () => {
  try {
    const clientStartTime = Date.now(); // T0: Thời gian bắt đầu gọi API

    // Gọi API lấy giờ Server
    const response = await api.get('/time/sync');
    const serverTime = response.data.serverTime; // T1: Thời gian Server trả về

    const clientEndTime = Date.now(); // T2: Thời gian nhận được Response

    // 1. Tính thời gian gói tin đi và về (Round Trip Time)
    const latency = (clientEndTime - clientStartTime) / 2;

    // 2. Ước tính giờ thực tế của Server tại thời điểm nhận được gói tin
    const estimatedServerTime = serverTime + latency;

    // 3. Tính toán độ lệch (Offset)
    timeOffset = estimatedServerTime - clientEndTime;

    //console.log(`⏱️ Đã đồng bộ giờ Server. Độ lệch: ${timeOffset}ms`);
  } catch (error) {
    console.error("❌ Không thể đồng bộ giờ với Server", error);
    // Nếu lỗi, chấp nhận dùng giờ Local (offset = 0)
    timeOffset = 0;
  }
};

/**
 * Hàm thay thế cho new Date()
 * BẤT CỨ KHI NÀO frontend cần lấy giờ hiện tại, hãy gọi hàm này!
 */
export const getTrueTime = () => {
  return new Date(Date.now() + timeOffset);
};

/* ─────────────────────────────────────────────────────────
 * CÁC HÀM FORMAT THỜI GIAN
 * Lưu ý: Nếu không truyền tham số 'iso', hàm sẽ tự động
 * lấy thời gian thực (đã đồng bộ với Server) để format.
 * ───────────────────────────────────────────────────────── */
// Format: YYYY-MM-DD HH:MM:SS : "2023-10-05 14:48:00"
export function formatDateTime(iso) {
  if (iso === null) return ""; // NULL từ DB = chưa có dữ liệu, không phải "lấy giờ hiện tại"
  const d = iso !== undefined ? new Date(iso) : getTrueTime();
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  const second = String(d.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
// Ví dụ: "2023-10-05T14:48:00.000Z" => "21:48:00 05/10/2023"
export function formatDate(iso) {
  if (iso === null) return "";
  // Nếu có iso thì dùng nó, nếu không có (undefined) thì lấy giờ đồng bộ
  const d = iso !== undefined ? new Date(iso) : getTrueTime();
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("vi");
}

// Định dạng ngày theo chuẩn ISO : "2023-10-05"
export function formatDateISO(iso) {
  if (iso === null) return "";
  const d = iso !== undefined ? new Date(iso) : getTrueTime();
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Format: YYYY-MM-DD HH:MM AM/PM
export function formatDateTimeAMPM(iso) {
  if (iso === null) return "";
  const d = iso !== undefined ? new Date(iso) : getTrueTime();
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  let hour = d.getHours();
  const minute = String(d.getMinutes()).padStart(2, "0");

  const ampm = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;
  if (hour === 0) hour = 12;

  const hourStr = String(hour).padStart(2, "0");

  return `${year}-${month}-${day} ${hourStr}:${minute} ${ampm}`;
}
