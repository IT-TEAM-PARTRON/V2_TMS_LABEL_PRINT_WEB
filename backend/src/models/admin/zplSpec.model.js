import db from '../../config/db.js';

export default class ZplSpecModel {
  constructor({ ID, ZPLTYPE, ZPLDENSITY, ZPLCODE, EVENTUSER, EVENTTIME } = {}) {
    this.ID = ID;
    this.ZPLTYPE = ZPLTYPE;
    this.ZPLDENSITY = ZPLDENSITY;
    this.ZPLCODE = ZPLCODE;
    this.EVENTUSER = EVENTUSER;
    this.EVENTTIME = EVENTTIME;
  }

  static async getAllZplSpecs() {
    const rows = await db.query("SELECT * FROM ZPLSPEC ORDER BY ID ASC");
    if (!rows || !Array.isArray(rows)) return [];
    return rows.map((row) => new ZplSpecModel(row));
  }

  static async getZplSpecById(id) {
    const rows = await db.query("SELECT * FROM ZPLSPEC WHERE ID = ?", [id]);
    if (!rows || rows.length === 0) return null;
    return new ZplSpecModel(rows[0]);
  }

  static async getZplSpecByType(zplType) {
    const rows = await db.query("SELECT * FROM ZPLSPEC WHERE ZPLTYPE = ?", [zplType]);
    if (!rows || rows.length === 0) return null;
    return new ZplSpecModel(rows[0]);
  }

  static async getZplSpecByTypeAndDensity(zplType, zplDensity, connection = db) {
    const rows = await connection.query(
      "SELECT * FROM ZPLSPEC WHERE ZPLTYPE = ? AND ZPLDENSITY = ? LIMIT 1",
      [zplType, zplDensity],
    );
    return rows[0] ? new ZplSpecModel(rows[0]) : null;
  }

  static async updateZplSpec(id, { ZPLCODE, EVENTUSER }) {
    let conn;
    try {
      conn = await db.getConnection();
      await conn.beginTransaction();

      // 1. Lấy thông tin ZPLTYPE hiện tại để lưu lịch sử
      const currentRows = await conn.query("SELECT ZPLTYPE, ZPLDENSITY FROM ZPLSPEC WHERE ID = ?", [id]);
      if (!currentRows || currentRows.length === 0) {
        await conn.rollback();
        return null;
      }
      const zplType = currentRows[0].ZPLTYPE;
      const zplDensity = currentRows[0].ZPLDENSITY;

      // 2. Cập nhật bảng ZPLSPEC
      const updateResult = await conn.query(
        "UPDATE ZPLSPEC SET ZPLCODE = ?, EVENTUSER = ?, EVENTTIME = NOW() WHERE ID = ?",
        [ZPLCODE, EVENTUSER, id]
      );

      if (updateResult.affectedRows === 0) {
        await conn.rollback();
        return null;
      }

      // 3. Lưu lịch sử vào bảng ZPLSPEC_HISTORY
      await conn.query(
        "INSERT INTO ZPLSPEC_HISTORY (ZPLTYPE, ZPLDENSITY, ZPLCODE, EVENTUSER, EVENTTIME) VALUES (?, ?, ?, ?, NOW())",
        [zplType, zplDensity, ZPLCODE, EVENTUSER]
      );

      await conn.commit();
      return true;
    } catch (error) {
      if (conn) await conn.rollback();
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
}
