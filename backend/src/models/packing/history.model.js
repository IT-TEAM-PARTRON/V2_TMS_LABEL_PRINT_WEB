import db from "../../config/db.js";

const buildWhereClause = ({ boxQr, dateFrom, dateTo }) => {
  const conditions = [];
  const params = [];

  if (boxQr) {
    conditions.push("BOXLABEL_QR = ?");
    params.push(boxQr);
  }

  if (dateFrom && dateTo) {
    conditions.push("EVENTTIME >= ?");
    conditions.push("EVENTTIME < DATE_ADD(?, INTERVAL 1 DAY)");
    params.push(`${dateFrom} 00:00:00`, dateTo);
  }

  return {
    sql: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
};

export default class PackingHistoryModel {
  static async search({ boxQr, dateFrom, dateTo, page, pageSize }) {
    const where = buildWhereClause({ boxQr, dateFrom, dateTo });
    const offset = (page - 1) * pageSize;

    const countRows = await db.query(
      `SELECT COUNT(*) AS TOTAL FROM PACKING ${where.sql}`,
      where.params,
    );
    const rows = await db.query(
      `SELECT
         ID,
         MODELID,
         BOXLABEL_QR,
         QUANTITY,
         REMARKS,
         LOTNO,
         EXPIRATIONDATE,
         EVENTUSER,
         EVENTTIME
       FROM PACKING
       ${where.sql}
       ORDER BY EVENTTIME DESC, ID DESC
       LIMIT ? OFFSET ?`,
      [...where.params, pageSize, offset],
    );

    return {
      rows,
      total: Number(countRows[0]?.TOTAL || 0),
    };
  }
}
