import db from '../../config/db.js';

// Model quản lý bảng FACTORY
export default class FactoryModel {
  // Đã thêm = {} ở cuối để tránh triệt để lỗi destructuring undefined
  constructor({ ID, FACTORYID, DESCRIPTION, EVENTTIME } = {}) {
    this.ID = ID;
    this.FACTORYID = FACTORYID;
    this.DESCRIPTION = DESCRIPTION;
    this.EVENTTIME = EVENTTIME;
  }

  // Lấy toàn bộ danh sách Factory
  static async getAllFactories() {
    const rows = await db.query("SELECT * FROM FACTORY ORDER BY FACTORYID ASC");
    if (!rows || !Array.isArray(rows)) return [];
    return rows.map((row) => new FactoryModel(row));
  }

  // Tìm Factory theo ID (Primary Key)
  static async getFactoryById(id) {
    // Đã BỎ dấu ngoặc vuông [rows]
    const rows = await db.query("SELECT * FROM FACTORY WHERE ID = ?", [id]);
    if (!rows || rows.length === 0) return null;
    return new FactoryModel(rows[0]);
  }

  // Kiểm tra trùng FACTORYID
  static async getByFactoryId(factoryId) {
    // Đã BỎ dấu ngoặc vuông [rows]
    const rows = await db.query("SELECT * FROM FACTORY WHERE FACTORYID = ?", [factoryId]);
    if (!rows || rows.length === 0) return null;
    return new FactoryModel(rows[0]);
  }

  // Tạo mới Factory
  static async createFactory({ FACTORYID, DESCRIPTION }) {
    const result = await db.query(
      "INSERT INTO FACTORY (FACTORYID, DESCRIPTION) VALUES (?, ?)",
      [FACTORYID, DESCRIPTION || ""]
    );
    if (result.affectedRows === 0) return null;
    return new FactoryModel({ ID: Number(result.insertId), FACTORYID, DESCRIPTION });
  }

  // Cập nhật Factory
  static async updateFactory(id, { FACTORYID, DESCRIPTION }) {
    const result = await db.query(
      "UPDATE FACTORY SET FACTORYID = ?, DESCRIPTION = ? WHERE ID = ?",
      [FACTORYID, DESCRIPTION || "", id]
    );
    if (result.affectedRows === 0) return null;
    return new FactoryModel({ ID: id, FACTORYID, DESCRIPTION });
  }

  // Xóa Factory
  static async deleteFactory(id) {
    const result = await db.query("DELETE FROM FACTORY WHERE ID = ?", [id]);
    return result.affectedRows > 0;
  }
}