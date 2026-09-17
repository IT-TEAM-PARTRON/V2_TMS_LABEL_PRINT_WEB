import db from '../../config/db.js';

export default class RoleModel {

  constructor({ ID, ROLEID, DESCRIPTION, EVENTUSER, EVENTTIME }) {
    this.ID = ID;
    this.ROLEID = ROLEID;
    this.DESCRIPTION = DESCRIPTION;
    this.EVENTUSER = EVENTUSER;
    this.EVENTTIME = EVENTTIME;
  }

  // Lấy toàn bộ danh sách roles
  static async getAllRoles() {
    const rows = await db.query("SELECT * FROM ROLE ORDER BY ROLEID ASC");

    if (!rows || !Array.isArray(rows)) {
      return [];
    }
    // Trả về mảng các object RoleModel thông qua constructor
    return rows.map((row) => new RoleModel(row));
  }

  // Tìm role theo id (Primary Key)
  static async getRoleById(id) {
    const [rows] = await db.query("SELECT * FROM ROLE WHERE ID = ?", [id]);
    if (!rows || rows.length === 0) return null;
    return new RoleModel(rows[0]);
  }

  // Tìm theo role_id (Tên role) để check trùng
  static async getRoleByUniqueName(role_id) {
    const [rows] = await db.query("SELECT * FROM ROLE WHERE ROLEID = ?", [role_id]);
    if (!rows || rows.length === 0) return null;
    return new RoleModel(rows[0]);
  }

  // Tạo mới Role
  static async createRole({ ROLEID, DESCRIPTION, EVENTUSER }) {
    const result = await db.query(
      "INSERT INTO ROLE (ROLEID, DESCRIPTION, EVENTUSER) VALUES (?, ?, ?)",
      [ROLEID, DESCRIPTION || "", EVENTUSER]
    );

    if (result.affectedRows === 0) return null;

    return new RoleModel({
      ID: Number(result.insertId),
      ROLEID,
      DESCRIPTION,
      EVENTUSER,
    });
  }

  // Cập nhật Role
  static async updateRole(id, { ROLEID, DESCRIPTION, EVENTUSER }) {
    const result = await db.query(
      "UPDATE ROLE SET ROLEID = ?, DESCRIPTION = ?, EVENTUSER = ? WHERE ID = ?",
      [ROLEID, DESCRIPTION || "", EVENTUSER, id]
    );

    if (result.affectedRows === 0) return null;

    return new RoleModel({ ID: id, ROLEID, DESCRIPTION, EVENTUSER });
  }

  // Xóa Role
  static async deleteRole(id) {
    const result = await db.query("DELETE FROM ROLE WHERE ID = ?", [id]);
    return result.affectedRows > 0;
  }
}