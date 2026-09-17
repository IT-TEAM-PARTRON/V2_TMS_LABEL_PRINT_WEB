import db from "../../config/db.js";
import ModelSpecModel from "../admin/modelSpec.model.js";
import ZplSpecModel from "../admin/zplSpec.model.js";
import { buildBoxLabelQr, buildDateCode, buildLotNo } from "../../utils/boxLabel.js";

const SEQUENCE_LOCK = "TMS_BOX_LABEL_SEQUENCE";

export default class BoxLabelModel {
  static async getModels() {
    return ModelSpecModel.getAllModels();
  }

  static async getTemplate(zplType) {
    return ZplSpecModel.getZplSpecByTypeAndDensity(zplType, "300DPI");
  }

  static async createBoxLabel({ modelId, expirationDate, quantity, remarks, eventUser }) {
    let conn;
    let lockAcquired = false;
    try {
      conn = await db.getConnection();
      const lockRows = await conn.query("SELECT GET_LOCK(?, 10) AS ACQUIRED", [SEQUENCE_LOCK]);
      lockAcquired = Number(lockRows[0]?.ACQUIRED) === 1;
      if (!lockAcquired) throw new Error("Unable to allocate Box Label sequence");

      await conn.beginTransaction();
      const model = await ModelSpecModel.getModelById(modelId, conn);
      if (!model) {
        const error = new Error("Không tìm thấy Model");
        error.status = 404;
        error.errorCode = "MODEL_NOT_FOUND";
        throw error;
      }

      const dateRows = await conn.query("SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS CURRENTDATE");
      const dateCode = buildDateCode(dateRows[0].CURRENTDATE);
      const lotRows = await conn.query(
        "SELECT LOTNO FROM PACKING WHERE LOTNO LIKE ?",
        [`${dateCode}-X%`],
      );
      const lastSequence = lotRows.reduce((max, row) => {
        const match = new RegExp(`^${dateCode}-X(\\d{3})$`).exec(row.LOTNO);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0);
      const lotNo = buildLotNo(dateCode, lastSequence + 1);
      const qrCode = buildBoxLabelQr({ ...model, LOTNO: lotNo, QUANTITY: quantity });

      const template = await ZplSpecModel.getZplSpecByTypeAndDensity("BOX_LABEL", "300DPI", conn);
      if (!template) {
        const error = new Error("Không tìm thấy ZPL BOX_LABEL 300DPI");
        error.status = 404;
        error.errorCode = "ZPL_TEMPLATE_NOT_FOUND";
        throw error;
      }

      const result = await conn.query(
        `INSERT INTO PACKING
          (MODELID, BOXLABEL_QR, QUANTITY, REMARKS, LOTNO, EXPIRATIONDATE, EVENTUSER, EVENTTIME)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [model.MODELID, qrCode, quantity, remarks || null, lotNo, expirationDate, eventUser],
      );
      await conn.commit();

      return {
        ID: Number(result.insertId),
        MODELID: model.MODELID,
        MATERIALSCODE: model.MATERIALSCODE,
        PRODUCT: model.PRODUCT,
        PRODUCTFACTORY: model.PRODUCTFACTORY,
        SUPPLIER: model.SUPPLIER,
        QUANTITY: quantity,
        LOTNO: lotNo,
        EXPIRATIONDATE: expirationDate,
        REMARKS: remarks || "",
        QRCODE: qrCode,
        ZPLCODE: template.ZPLCODE,
        ZPLDENSITY: template.ZPLDENSITY,
      };
    } catch (error) {
      if (conn) await conn.rollback();
      throw error;
    } finally {
      if (conn && lockAcquired) await conn.query("SELECT RELEASE_LOCK(?)", [SEQUENCE_LOCK]);
      if (conn) conn.release();
    }
  }
}
