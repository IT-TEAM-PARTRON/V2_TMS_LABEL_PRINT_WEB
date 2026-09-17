import db from "../../config/db.js";

export default class AuthUser {
  constructor({ ID, USERID, PASSWORD, FULLNAME, ROLEID, DESCRIPTION }) {
    this.ID = ID;
    this.USERID = USERID;
    this.PASSWORD = PASSWORD;
    this.FULLNAME = FULLNAME;
    this.ROLEID = ROLEID;
    this.DESCRIPTION = DESCRIPTION;
  }

  static async findUserByEmail(email, connection = db) {
    const rows = await connection.query(
      `SELECT u.*, r.DESCRIPTION
       FROM USER u
       INNER JOIN ROLE r ON r.ROLEID = u.ROLEID
       WHERE u.USERID = ?
       LIMIT 1`,
      [email],
    );
    return rows[0] ? new AuthUser(rows[0]) : null;
  }
}
