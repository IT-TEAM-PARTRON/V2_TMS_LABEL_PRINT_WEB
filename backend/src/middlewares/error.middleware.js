import { fail } from "../middlewares/responseHandler.js";

const errorMiddlewares = (err, req, res, next) => {
  console.error("ERROR:", err);

  let status = err.status || 500;
  let message = err.message || "Internal Server Error";
  let errorCode = err.errorCode || "SERVER_ERROR";

  // Xử lý lỗi khóa ngoại (Foreign Key Constraint) của MariaDB
  if (err.code === "ER_ROW_IS_REFERENCED_2" || err.errno === 1451) {
    status = 409;
    errorCode = "FOREIGN_KEY_CONSTRAINT";
    const tMsg = req.t ? req.t("server.foreignKeyError") : "server.foreignKeyError";
    message = tMsg === "server.foreignKeyError" ? "Dữ liệu đang được sử dụng ở nơi khác, không thể xóa." : tMsg;
  }

  // Xử lý lỗi trùng lặp dữ liệu (Duplicate Entry)
  if (err.code === "ER_DUP_ENTRY" || err.errno === 1062) {
    status = 409;
    errorCode = "DUPLICATE_ENTRY";
    const tMsg = req.t ? req.t("server.duplicateEntry") : "server.duplicateEntry";
    message = tMsg === "server.duplicateEntry" ? "Dữ liệu đã tồn tại trong hệ thống." : tMsg;
  }

  return fail(res, message, status, errorCode);
};

export default errorMiddlewares;