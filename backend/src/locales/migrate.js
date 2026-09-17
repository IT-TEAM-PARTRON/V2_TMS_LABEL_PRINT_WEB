//export json -> database
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js'; // Kiểm tra lại đường dẫn này tùy vào file db.js của bạn
import { en } from './en.js';
import { vi } from './vi.js';
import { kr } from './kr.js';

// Định nghĩa __dirname cho ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 1. Hàm phẳng hóa Object (Nested -> Dot notation)
 */
const flattenObject = (obj, prefix = '') => {
  return Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
};

/**
 * 2. Hàm tạo ID tiếp theo (L00001, L00002...)
 */
const generateNextId = (currentMaxId, index) => {
  const lastNum = currentMaxId ? parseInt(currentMaxId.substring(1)) : 0;
  const nextNum = lastNum + index + 1;
  return `L${nextNum.toString().padStart(5, '0')}`;
};

const migrate = async () => {
  try {
    console.log("⏳ Đang kết nối dữ liệu giữa Frontend và Backend...");

    // ĐƯỜNG DẪN TỪ: backend/src/locales/ -> frontend/src/i18n/
    const frontendI18nPath = path.join(__dirname, '../../../frontend/src/i18n');

    const viFEPath = path.join(frontendI18nPath, 'vi.json');
    const enFEPath = path.join(frontendI18nPath, 'en.json');
    const krFEPath = path.join(frontendI18nPath, 'kr.json');

    // Đọc file JSON Frontend
    const viFE = JSON.parse(fs.readFileSync(viFEPath, 'utf8'));
    const enFE = JSON.parse(fs.readFileSync(enFEPath, 'utf8'));
    const krFE = JSON.parse(fs.readFileSync(krFEPath, 'utf8'));

    // Phẳng hóa dữ liệu
    const finalVi = { ...flattenObject(viFE), ...flattenObject(vi) };
    const finalEn = { ...flattenObject(enFE), ...flattenObject(en) };
    const finalKr = { ...flattenObject(krFE), ...flattenObject(kr) };

    const allKeys = Array.from(new Set([
      ...Object.keys(finalVi),
      ...Object.keys(finalEn),
      ...Object.keys(finalKr)
    ]));

    // Lấy ID cao nhất hiện tại trong DB
    const rows = await db.query("SELECT ID FROM TRANSLATIONS WHERE ID LIKE 'L%' ORDER BY ID DESC LIMIT 1");
    // Lưu ý: thư viện mariadb trả về mảng trực tiếp, kiểm tra rows[0]
    const currentMaxId = rows.length > 0 ? rows[0].ID : null;

    console.log(`🚀 Tìm thấy tổng cộng ${allKeys.length} keys. Đang đẩy vào Database...`);

    for (let i = 0; i < allKeys.length; i++) {
      const keyName = allKeys[i];
      const contentVi = finalVi[keyName] || null;
      const contentEn = finalEn[keyName] || null;
      const contentKr = finalKr[keyName] || null;

      // Kiểm tra xem key đã tồn tại trong cột description chưa
      const existing = await db.query("SELECT ID FROM TRANSLATIONS WHERE DESCRIPTION = ?", [keyName]);

      if (existing.length > 0) {
        // Nếu tồn tại key (description), tiến hành Update
        await db.query(
          "UPDATE TRANSLATIONS SET VI = ?, EN = ?, KR = ?, EVENTUSER = 'SYSTEM_MIGRATE' WHERE DESCRIPTION = ?",
          [contentVi, contentEn, contentKr, keyName]
        );
      } else {
        // Nếu chưa tồn tại, tạo ID Lxxxxx mới và Insert
        const nextId = generateNextId(currentMaxId, i);
        await db.query(
          "INSERT INTO TRANSLATIONS (ID, VI, EN, KR, DESCRIPTION, EVENTUSER) VALUES (?, ?, ?, ?, ?, ?)",
          [nextId, contentVi, contentEn, contentKr, keyName, 'SYSTEM_MIGRATE']
        );
      }
    }

    console.log("✅ Chúc mừng! Dữ liệu đã được đồng bộ hóa thành công.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi Migration:", error);
    process.exit(1);
  }
};

migrate();