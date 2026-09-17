import db from '../../config/db.js';

export default class MappingModel {
  // Constructor để ánh xạ dữ liệu từ Database sang Object
  constructor({ ID, ROLEID, DESCRIPTION, EVENTUSER, EVENTTIME }) {
    this.ID = ID;
    this.ROLEID = ROLEID;
    this.DESCRIPTION = DESCRIPTION;
    this.EVENTUSER = EVENTUSER;
    this.EVENTTIME = EVENTTIME;
  }

  /**
   * Cập nhật chuỗi Permission cho một Role dựa trên ID
   * @param {number} id - ID của bản ghi trong bảng role
   * @param {object} data - Object chứa permissions và event_user
   */
  static async updatePermission(id, { permissions, event_user }) {
    const result = await db.query(
      `UPDATE ROLE
       SET DESCRIPTION = ?, EVENTUSER = ?
       WHERE ID = ?`,
      [permissions, event_user, id]
    );

    // Nếu không có dòng nào bị ảnh hưởng, trả về null
    if (result.affectedRows === 0) return null;

    // Trả về instance mới sau khi update để đồng nhất logic với các spec khác
    return new MappingModel({
      ID: id,
      DESCRIPTION: permissions,
      EVENTUSER: event_user
    });
  }

}