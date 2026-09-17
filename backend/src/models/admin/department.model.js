import db from '../../config/db.js';

// Model quản lý bảng DEPARTMENT
export default class DepartmentModel {
  constructor({ ID, FACTORYID, DEPARTMENTID, EVENTUSER, EVENTTIME }) {
    this.ID = ID;
    this.FACTORYID = FACTORYID;
    this.DEPARTMENTID = DEPARTMENTID;
    this.EVENTUSER = EVENTUSER;
    this.EVENTTIME = EVENTTIME;
  }

  // Lấy toàn bộ danh sách Department
  static async getAllDepartments() {
    const rows = await db.query("SELECT * FROM DEPARTMENT ORDER BY FACTORYID ASC, DEPARTMENTID ASC");
    if (!rows || !Array.isArray(rows)) return [];
    return rows.map((row) => new DepartmentModel(row));
  }

  // Lấy danh sách Department theo FACTORYID
  static async getDepartmentsByFactory(factoryId) {
    const rows = await db.query("SELECT * FROM DEPARTMENT WHERE FACTORYID = ? ORDER BY DEPARTMENTID ASC", [factoryId]);
    if (!rows || !Array.isArray(rows)) return [];
    return rows.map((row) => new DepartmentModel(row));
  }

  // Tìm Department theo ID (Primary Key)
  static async getDepartmentById(id) {
    const [rows] = await db.query("SELECT * FROM DEPARTMENT WHERE ID = ?", [id]);
    if (!rows || rows.length === 0) return null;
    return new DepartmentModel(rows[0]);
  }

  // Kiểm tra trùng cặp (FACTORYID, DEPARTMENTID)
  static async getByUniqueKey(factoryId, departmentId) {
    const [rows] = await db.query(
      "SELECT * FROM DEPARTMENT WHERE FACTORYID = ? AND DEPARTMENTID = ?",
      [factoryId, departmentId]
    );
    if (!rows || rows.length === 0) return null;
    return new DepartmentModel(rows[0]);
  }

  // Tạo mới Department
  static async createDepartment({ FACTORYID, DEPARTMENTID, EVENTUSER }) {
    const result = await db.query(
      "INSERT INTO DEPARTMENT (FACTORYID, DEPARTMENTID, EVENTUSER) VALUES (?, ?, ?)",
      [FACTORYID, DEPARTMENTID, EVENTUSER]
    );
    if (result.affectedRows === 0) return null;
    return new DepartmentModel({ ID: Number(result.insertId), FACTORYID, DEPARTMENTID, EVENTUSER });
  }

  // Cập nhật Department
  static async updateDepartment(id, { FACTORYID, DEPARTMENTID, EVENTUSER }) {
    const result = await db.query(
      "UPDATE DEPARTMENT SET FACTORYID = ?, DEPARTMENTID = ?, EVENTUSER = ? WHERE ID = ?",
      [FACTORYID, DEPARTMENTID, EVENTUSER, id]
    );
    if (result.affectedRows === 0) return null;
    return new DepartmentModel({ ID: id, FACTORYID, DEPARTMENTID, EVENTUSER });
  }

  // Xóa Department
  static async deleteDepartment(id) {
    const result = await db.query("DELETE FROM DEPARTMENT WHERE ID = ?", [id]);
    return result.affectedRows > 0;
  }
}
