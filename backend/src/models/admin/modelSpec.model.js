import db from "../../config/db.js";

export default class ModelSpecModel {
  constructor({ ID, MODELID, MATERIALSCODE, PRODUCT, PRODUCTFACTORY, SUPPLIER, DESCRIPTION, EVENTUSER, EVENTTIME } = {}) {
    this.ID = ID;
    this.MODELID = MODELID;
    this.MATERIALSCODE = MATERIALSCODE;
    this.PRODUCT = PRODUCT;
    this.PRODUCTFACTORY = PRODUCTFACTORY;
    this.SUPPLIER = SUPPLIER;
    this.DESCRIPTION = DESCRIPTION || "";
    this.EVENTUSER = EVENTUSER;
    this.EVENTTIME = EVENTTIME;
  }

  static async getAllModels() {
    const rows = await db.query("SELECT * FROM MODELSPEC ORDER BY EVENTTIME DESC");
    return Array.isArray(rows) ? rows.map((row) => new ModelSpecModel(row)) : [];
  }

  static async getModelById(id, connection = db) {
    const rows = await connection.query("SELECT * FROM MODELSPEC WHERE ID = ?", [id]);
    return rows[0] ? new ModelSpecModel(rows[0]) : null;
  }

  static async getByModelId(modelId, excludeId = null) {
    let query = "SELECT * FROM MODELSPEC WHERE MODELID = ?";
    const params = [modelId];
    if (excludeId !== null) {
      query += " AND ID <> ?";
      params.push(excludeId);
    }
    const rows = await db.query(query, params);
    return rows[0] ? new ModelSpecModel(rows[0]) : null;
  }

  static async createModel(data) {
    let conn;
    try {
      conn = await db.getConnection();
      await conn.beginTransaction();
      const result = await conn.query(
        `INSERT INTO MODELSPEC
          (MODELID, MATERIALSCODE, PRODUCT, PRODUCTFACTORY, SUPPLIER, DESCRIPTION, EVENTUSER, EVENTTIME)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [data.MODELID, data.MATERIALSCODE, data.PRODUCT, data.PRODUCTFACTORY, data.SUPPLIER, data.DESCRIPTION, data.EVENTUSER],
      );
      await this.insertHistory(conn, data);
      await conn.commit();
      return new ModelSpecModel({ ID: Number(result.insertId), ...data });
    } catch (error) {
      if (conn) await conn.rollback();
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  static async updateModel(id, data) {
    let conn;
    try {
      conn = await db.getConnection();
      await conn.beginTransaction();
      const result = await conn.query(
        `UPDATE MODELSPEC
         SET MODELID = ?, MATERIALSCODE = ?, PRODUCT = ?, PRODUCTFACTORY = ?,
             SUPPLIER = ?, DESCRIPTION = ?, EVENTUSER = ?, EVENTTIME = NOW()
         WHERE ID = ?`,
        [data.MODELID, data.MATERIALSCODE, data.PRODUCT, data.PRODUCTFACTORY, data.SUPPLIER, data.DESCRIPTION, data.EVENTUSER, id],
      );
      if (result.affectedRows === 0) {
        await conn.rollback();
        return null;
      }
      await this.insertHistory(conn, data);
      const model = await this.getModelById(id, conn);
      await conn.commit();
      return model;
    } catch (error) {
      if (conn) await conn.rollback();
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  static async deleteModel(id, eventUser) {
    let conn;
    try {
      conn = await db.getConnection();
      await conn.beginTransaction();
      const record = await this.getModelById(id, conn);
      if (!record) {
        await conn.rollback();
        return false;
      }
      await this.insertHistory(conn, { ...record, EVENTUSER: eventUser });
      await conn.query("DELETE FROM MODELSPEC WHERE ID = ?", [id]);
      await conn.commit();
      return true;
    } catch (error) {
      if (conn) await conn.rollback();
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }

  static async insertHistory(connection, data) {
    await connection.query(
      `INSERT INTO MODELSPEC_HISTORY
        (MODELID, MATERIALSCODE, PRODUCT, PRODUCTFACTORY, SUPPLIER, DESCRIPTION, EVENTUSER, EVENTTIME)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [data.MODELID, data.MATERIALSCODE, data.PRODUCT, data.PRODUCTFACTORY, data.SUPPLIER, data.DESCRIPTION || "", data.EVENTUSER],
    );
  }
}
