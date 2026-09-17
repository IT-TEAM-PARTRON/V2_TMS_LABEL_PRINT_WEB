// src/middleware/logger.middleware.js

import fs from "fs";
import path from "path";

// Error Logger Middleware
const loggerMiddleware = (err, req, res, next) => {
  try {
    const date = new Date().toISOString().split("T")[0];

    // Folder logs
    const logsDir = path.join(process.cwd(), "logs");
    const logPath = path.join(logsDir, `error-${date}.log`);

    // Tạo folder nếu chưa có
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const now = new Date().toLocaleString();

    const message = `
[${now}]
API: ${req.method} ${req.originalUrl}
ERROR: ${err.message}
STACK: ${err.stack}
-------------------------------------------------------
`;

    // 🔥 async (không block)
    fs.appendFile(logPath, message, (error) => {
      if (error) {
        console.error("❌ Ghi log thất bại:", error.message);
      }
    });

    // log console
    console.error("❌", err.message);

  } catch (logError) {
    console.error("❌ Logger crash:", logError.message);
  }

  // 👉 QUAN TRỌNG
  next(err);
};

export default loggerMiddleware;