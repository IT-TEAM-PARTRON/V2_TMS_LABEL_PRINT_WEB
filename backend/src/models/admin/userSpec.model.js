import db from "../../config/db.js";

// Admin - User Management
export default class UserModel {
  constructor({ ID, USERID, PASSWORD, FULLNAME, ROLEID, STATUS, FACTORYID, DEPARTMENTID, EVENTUSER, EVENTTIME }) {
    this.ID = ID;
    this.USERID = USERID;
    this.PASSWORD = PASSWORD;
    this.FULLNAME = FULLNAME;
    this.ROLEID = ROLEID;
    this.STATUS = STATUS;
    this.FACTORYID = FACTORYID;
    this.DEPARTMENTID = DEPARTMENTID;
    this.EVENTUSER = EVENTUSER;
    this.EVENTTIME = EVENTTIME;
  }
  static async getAllUsers() {
    const rows = await db.query("SELECT * FROM USER");
    return rows.map((row) => new UserModel(row));
  }
  static async getUserById(userId) {
    const [rows] = await db.query(
      "SELECT * FROM USER WHERE USERID = ?",
      [userId],
    );
    if (rows.length === 0) return null;
    return new UserModel(rows[0]);
  }
  static async createUser({ USERID, PASSWORD, FULLNAME, ROLEID, STATUS, FACTORYID = null, DEPARTMENTID = null, EVENTUSER = "" }) {
    const safeFactoryId = FACTORYID === "" ? null : FACTORYID;
    const safeDepartmentId = DEPARTMENTID === "" ? null : DEPARTMENTID;

    const result = await db.query(
      "INSERT INTO USER (USERID, PASSWORD, FULLNAME, ROLEID, STATUS, FACTORYID, DEPARTMENTID, EVENTUSER) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [USERID, PASSWORD, FULLNAME, ROLEID, STATUS, safeFactoryId, safeDepartmentId, EVENTUSER],
    );
    if (result.affectedRows === 0) return null;
    return new UserModel({ ID: Number(result.insertId), USERID, PASSWORD, FULLNAME, ROLEID, STATUS, FACTORYID: safeFactoryId, DEPARTMENTID: safeDepartmentId, EVENTUSER });
  }
  static async updateUser(id, { USERID, PASSWORD, FULLNAME, ROLEID, STATUS, FACTORYID = null, DEPARTMENTID = null, EVENTUSER = "" }) {
    const safeFactoryId = FACTORYID === "" ? null : FACTORYID;
    const safeDepartmentId = DEPARTMENTID === "" ? null : DEPARTMENTID;

    const result = await db.query(
      "UPDATE USER SET USERID = ?, PASSWORD = ?, FULLNAME = ?, ROLEID = ?, STATUS = ?, FACTORYID = ?, DEPARTMENTID = ?, EVENTUSER = ? WHERE ID = ?",
      [USERID, PASSWORD, FULLNAME, ROLEID, STATUS, safeFactoryId, safeDepartmentId, EVENTUSER, id],
    );
    if (result.affectedRows === 0) return null;
    return new UserModel({ ID: id, USERID, PASSWORD, FULLNAME, ROLEID, STATUS, FACTORYID: safeFactoryId, DEPARTMENTID: safeDepartmentId, EVENTUSER });
  }
  static async deleteUser(id) {
    const result = await db.query(
      "DELETE FROM USER WHERE ID = ?",
      [id],
    );
    if (result.affectedRows === 0) return null;
    return { ID: id };
  }
  static async changeUserPassword(id, newPassword) {
    const result = await db.query(
      "UPDATE USER SET PASSWORD = ? WHERE ID = ?",
      [newPassword, id],
    );
    if (result.affectedRows === 0) return null;
    return { ID: id };
  }
}
