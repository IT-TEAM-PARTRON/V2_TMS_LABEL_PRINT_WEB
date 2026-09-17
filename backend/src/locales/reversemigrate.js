//import database -> json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js';

// Định nghĩa __dirname cho ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Hàm "nở" Object (Dot notation -> Nested Object)
 * Từ: "login.title": "Chào" -> { login: { title: "Chào" } }
 */
const unflattenObject = (data) => {
  const result = {};
  for (const key in data) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = data[key];
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    }
  }
  return result;
};

const reverseMigrate = async () => {
  try {
    console.log("⏳ Đang lấy dữ liệu từ Database để đồng bộ về file...");

    // 1. Truy vấn toàn bộ dữ liệu từ bảng translations
    const rows = await db.query("SELECT VI, EN, KR, DESCRIPTION FROM TRANSLATIONS");

    if (rows.length === 0) {
      console.log("⚠️ Database trống, không có dữ liệu để đồng bộ.");
      process.exit(0);
    }

    const viFlat = {}, enFlat = {}, krFlat = {};

    // 2. Phân loại dữ liệu dựa trên cột description (Key)
    rows.forEach(row => {
      const key = row.DESCRIPTION?.trim(); // DESCRIPTION chính là key_name (ví dụ: auth.login)
      if (key) {
        viFlat[key] = row.VI || "";
        enFlat[key] = row.EN || "";
        krFlat[key] = row.KR || "";
      }
    });

    // 3. Chuyển đổi về dạng Object lồng nhau (Nested)
    const viNested = unflattenObject(viFlat);
    const enNested = unflattenObject(enFlat);
    const krNested = unflattenObject(krFlat);

    // 4. ĐƯỜNG DẪN ĐẾN CÁC FILE
    const frontendPath = path.join(__dirname, '../../../frontend/src/i18n');
    const backendPath = __dirname; // Ngay tại thư mục hiện tại

    // --- GHI FILE CHO FRONTEND (Dạng .json) ---
    console.log("📂 Đang cập nhật file Frontend (.json)...");
    fs.writeFileSync(path.join(frontendPath, 'vi.json'), JSON.stringify(viNested, null, 2), 'utf8');
    fs.writeFileSync(path.join(frontendPath, 'en.json'), JSON.stringify(enNested, null, 2), 'utf8');
    fs.writeFileSync(path.join(frontendPath, 'kr.json'), JSON.stringify(krNested, null, 2), 'utf8');

    // --- GHI FILE CHO BACKEND (Dạng .js với lệnh export) ---
    console.log("📂 Đang cập nhật file Backend (.js)...");

    const writeJsFile = (filePath, langCode, data) => {
      const content = `// ${langCode.toUpperCase()} translations - Generated from Database\nexport const ${langCode} = ${JSON.stringify(data, null, 2)};`;
      fs.writeFileSync(filePath, content, 'utf8');
    };

    writeJsFile(path.join(backendPath, 'vi.js'), 'vi', viNested);
    writeJsFile(path.join(backendPath, 'en.js'), 'en', enNested);
    writeJsFile(path.join(backendPath, 'kr.js'), 'kr', krNested);

    console.log("✅ Chúc mừng! Toàn bộ file Frontend và Backend đã được đồng bộ từ Database.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi Reverse Migration:", error);
    process.exit(1);
  }
};

reverseMigrate();