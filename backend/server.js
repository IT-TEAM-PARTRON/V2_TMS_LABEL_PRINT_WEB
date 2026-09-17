import express from "express";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { checkDBConnection } from "./src/config/db.js";
import i18nManager from "./src/locales/i18n.js";
import commonRoutes from "./src/routes/common.route.js";

// Import các middleware và route của bạn
import authRoutes from "./src/routes/auth.route.js";
import errorMiddleware from "./src/middlewares/error.middleware.js";
import loggerMiddleware from "./src/middlewares/logger.middleware.js";
// Import các route
import adminRoutes from "./src/routes/admin.route.js";
import outboxRoutes from "./src/routes/outbox.route.js";
import reprintRoutes from "./src/routes/reprint.route.js";
import historyRoutes from "./src/routes/history.route.js";



// 1. Cấu hình môi trường và đường dẫn
dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Middleware cơ bản (Global)
app.use(cors());
app.use(express.json());
app.use(i18nManager.i18nMiddleware); // khai báo sử dụng i18n
app.use(morgan("dev"));

// 3. Phục vụ file tĩnh từ React (Frontend)
const distPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(distPath));

// 4. Định nghĩa các API Routes
app.use("/api", commonRoutes); // Route cho i18n và thời gian
app.use("/api", authRoutes);
app.use("/api", adminRoutes);
app.use("/api", outboxRoutes);
app.use("/api", reprintRoutes);
app.use("/api", historyRoutes);



// 5. Fallback cho Single Page Application (React Router)
// Những request không phải /api và không khớp file tĩnh sẽ trả về index.html
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next(); // Nếu là API lỗi thì đẩy xuống errorMiddleware
  }
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next(); // Nếu không có file index thì báo lỗi 404
  }
});

// 6. Middleware xử lý lỗi (Phải đặt CUỐI CÙNG)
app.use(loggerMiddleware); // Ghi log lỗi
app.use(errorMiddleware);  // Trả phản hồi lỗi về client

// 7. Khởi chạy Server
const PORT = process.env.PORT || 7007;

const startServer = async () => {
  try {
    // Gọi hàm kiểm tra kết nối DB trước
    await checkDBConnection();

    // QUAN TRỌNG: Nạp bản dịch vào RAM trước khi server nhận request
        await i18nManager.loadTranslationsIntoMemory();

    // Nếu DB kết nối thành công, mới bắt đầu lắng nghe cổng
    app.listen(PORT, () => {
      console.log(`🚀 [Server]: Đang chạy tại http://localhost:${PORT}`);
      console.log(`📂 [Static]: Phục vụ file từ: ${distPath}`);
    });
  } catch (error) {
    console.error("❌ [Fatal]: Không thể khởi động server do lỗi Database!");
    process.exit(1); // Thoát chương trình với mã lỗi
  }
};

startServer();