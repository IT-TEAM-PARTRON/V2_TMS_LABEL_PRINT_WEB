import * as mariadb from "mariadb";
import dotenv from "dotenv";

dotenv.config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "partronVINAITDEV",
  database: process.env.DB_NAME || "DB_BASE_WEB",

  // 1. Tăng giới hạn kết nối
  connectionLimit: process.env.DB_CONNECTION_LIMIT
    ? Number(process.env.DB_CONNECTION_LIMIT)
    : 10,

  // 2. Tự động đóng connection nếu rảnh rỗi (Giảm tải cho RAM của MariaDB)
  idleTimeout: 60000, // 60 giây

  // 3. Xử lý múi giờ chuẩn (Khắc phục lỗi lệch giờ)
  timezone: "+07:00", // Ép về múi giờ Việt Nam

  // 4. Ép MariaDB trả về Ngày/Giờ dưới dạng Chuỗi (String) thay vì Object Date của JS
  // Giúp ngày giờ gửi qua JSON giữ nguyên vẹn định dạng như dưới Database
  dateStrings: true,
});
/**
 * Hàm kiểm tra kết nối ngay khi khởi động Server
 * Giúp phát hiện sớm lỗi sập DB thay vì đợi User báo lỗi
 */
export const checkDBConnection = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log(
      `✅ [Database] Kết nối thành công đến MariaDB (${process.env.DB_NAME})`,
    );
  } catch (err) {
    console.error(
      "❌ [Database] Lỗi kết nối MariaDB. Vui lòng kiểm tra lại dịch vụ cơ sở dữ liệu!",
    );
    console.error(err.message);
    process.exit(1); // Dừng chạy Node.js ngay lập tức nếu không có Database
  } finally {
    // LUÔN LUÔN phải release connection trả lại cho Pool
    if (conn) conn.release();
  }
};
// Xử lý lỗi TypeError: Do not know how to serialize a BigInt của Express JSON
BigInt.prototype.toJSON = function () {
  return Number(this);
};

export default pool;
