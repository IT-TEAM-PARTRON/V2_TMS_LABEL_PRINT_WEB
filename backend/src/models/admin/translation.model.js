import db from "../../config/db.js";

export default class TranslationModel {
  constructor({ ID, EN, VI, KR, DESCRIPTION, EVENTUSER, EVENTTIME }) {
    this.ID = ID;
    this.EN = EN;
    this.VI = VI;
    this.KR = KR;
    this.DESCRIPTION = DESCRIPTION;
    this.EVENTUSER = EVENTUSER;
    this.EVENTTIME = EVENTTIME;
  }

  static async getAll() {
    const rows = await db.query("SELECT * FROM TRANSLATIONS ORDER BY ID ASC");
    if (!rows) return [];
    return rows.map((row) => new TranslationModel(row));
  }

  static async update(ID, data) {
    const { EN, VI, KR } = data;
    await db.query(
      "UPDATE TRANSLATIONS SET EN = ?, VI = ?, KR = ? WHERE ID = ?",
      [EN, VI, KR, ID]
    );
    return true;
  }
  /**
   * Cập nhật hàng loạt dữ liệu từ Excel
   * @param {Array} translations - Danh sách [{id, en, vi, kr}, ...]
   */
  static async updateBulk(changedRows) {
    let conn;
    try {
      conn = await db.getConnection();

      // SQL Update chuẩn
      const sql = "UPDATE TRANSLATIONS SET EN = ?, VI = ?, KR = ? WHERE ID = ?";

      // Chuyển mảng object thành mảng tham số (Array of Arrays)
      // Chú ý thứ tự: [EN, VI, KR, ID] tương ứng với dấu ? trong SQL
      const params = changedRows.map(row => [row.EN, row.VI, row.KR, row.ID]);

      // Thực hiện batch update
      await conn.batch(sql, params);

      return true;
    } catch (err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }
}