import db from "../../config/db.js";

export default class ReprintLabelModel {
  static async lookupBoxLabel(boxQr) {
    const rows = await db.query(
      `SELECT
         p.ID,
         p.MODELID,
         p.BOXLABEL_QR,
         p.QUANTITY,
         p.REMARKS,
         p.LOTNO,
         p.EXPIRATIONDATE,
         p.EVENTUSER,
         p.EVENTTIME,
         m.MATERIALSCODE,
         m.PRODUCT,
         m.PRODUCTFACTORY,
         m.SUPPLIER,
         z.ZPLCODE,
         z.ZPLDENSITY,
         (
           SELECT COUNT(*)
           FROM REPRINT_HISTORY rh
           WHERE rh.LABELTYPE = 'OUTBOX'
             AND rh.LABELCODE = p.BOXLABEL_QR
         ) AS REPRINTCOUNT
       FROM PACKING p
       INNER JOIN MODELSPEC m ON m.MODELID = p.MODELID
       LEFT JOIN ZPLSPEC z
         ON z.ZPLTYPE = 'BOX_LABEL'
        AND UPPER(z.ZPLDENSITY) = '300DPI'
       WHERE p.BOXLABEL_QR = ?
       ORDER BY z.ID ASC
       LIMIT 1`,
      [boxQr],
    );

    if (!rows[0]) return null;
    return {
      ...rows[0],
      QRCODE: rows[0].BOXLABEL_QR,
      REPRINTCOUNT: Number(rows[0].REPRINTCOUNT || 0),
    };
  }

  static async logBoxLabelReprint({ boxQr, eventUser }) {
    let conn;
    try {
      conn = await db.getConnection();
      await conn.beginTransaction();

      const packingRows = await conn.query(
        "SELECT ID FROM PACKING WHERE BOXLABEL_QR = ? LIMIT 1",
        [boxQr],
      );
      if (!packingRows[0]) {
        await conn.rollback();
        return null;
      }

      const result = await conn.query(
        `INSERT INTO REPRINT_HISTORY
          (LABELTYPE, LABELCODE, EVENTUSER, EVENTTIME)
         VALUES ('OUTBOX', ?, ?, NOW())`,
        [boxQr, eventUser],
      );
      await conn.commit();

      return {
        ID: Number(result.insertId),
        LABELTYPE: "OUTBOX",
        LABELCODE: boxQr,
        EVENTUSER: eventUser,
      };
    } catch (error) {
      if (conn) await conn.rollback();
      throw error;
    } finally {
      if (conn) conn.release();
    }
  }
}
