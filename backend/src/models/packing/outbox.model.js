import db from "../../config/db.js";
import ModelSpecModel from "../admin/modelSpec.model.js";
import ZplSpecModel from "../admin/zplSpec.model.js";
import { buildBoxLabelQr } from "../../utils/boxLabel.js";

export default class BoxLabelModel {
  static async getModels() {
    return ModelSpecModel.getAllModels();
  }

  static async getTemplate(zplType, zplDensity) {
    return ZplSpecModel.getZplSpecByTypeAndDensity(zplType, zplDensity);
  }

  static async createBoxLabel({
    modelId,
    lotNo,
    expirationDate,
    quantity,
    remarks,
    zplDensity,
    eventUser,
  }) {
    let conn;
    try {
      conn = await db.getConnection();
      await conn.beginTransaction();
      const model = await ModelSpecModel.getModelById(modelId, conn);
      if (!model) {
        const error = new Error("Không tìm thấy Model");
        error.status = 404;
        error.errorCode = "MODEL_NOT_FOUND";
        throw error;
      }

      const existingLot = await conn.query(
        "SELECT ID FROM PACKING WHERE LOTNO = ? LIMIT 1 FOR UPDATE",
        [lotNo],
      );
      if (existingLot[0]) {
        const error = new Error("Lot No. already exists");
        error.status = 409;
        error.errorCode = "LOT_NO_DUPLICATED";
        throw error;
      }

      const qrCode = buildBoxLabelQr({ ...model, LOTNO: lotNo, QUANTITY: quantity });

      const template = await ZplSpecModel.getZplSpecByTypeAndDensity(
        "BOX_LABEL",
        zplDensity,
        conn,
      );
      if (!template) {
        const error = new Error(`ZPL BOX_LABEL ${zplDensity} was not found`);
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
      if (conn) conn.release();
    }
  }
}
