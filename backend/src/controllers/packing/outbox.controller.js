import BoxLabelModel from "../../models/packing/outbox.model.js";
import { fail, ok } from "../../middlewares/responseHandler.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const getBoxLabelModels = async (req, res, next) => {
  try {
    return ok(res, await BoxLabelModel.getModels(), "Lấy danh sách Model thành công");
  } catch (error) {
    return next(error);
  }
};

export const getBoxLabelTemplate = async (req, res, next) => {
  try {
    const zplType = String(req.params.type || "").toUpperCase();
    if (!["BOX_LABEL", "BOX_LABEL_TEST"].includes(zplType)) {
      return fail(res, "ZPL Type không hợp lệ", 400, "INVALID_ZPL_TYPE");
    }
    const template = await BoxLabelModel.getTemplate(zplType);
    if (!template) {
      return fail(res, `Không tìm thấy ZPL ${zplType} 300DPI`, 404, "ZPL_TEMPLATE_NOT_FOUND");
    }
    return ok(res, template, "Lấy ZPL Template thành công");
  } catch (error) {
    return next(error);
  }
};

export const createBoxLabel = async (req, res, next) => {
  try {
    const modelId = Number(req.body.modelId);
    const quantity = Number(req.body.quantity);
    const expirationDate = String(req.body.expirationDate || "").trim();
    const remarks = String(req.body.remarks || "").trim();

    if (!Number.isInteger(modelId) || modelId < 1) {
      return fail(res, "Model không hợp lệ", 400, "INVALID_MODEL");
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99999) {
      return fail(res, "Quantity phải là số nguyên từ 1 đến 99999", 400, "INVALID_QUANTITY");
    }
    if (!DATE_PATTERN.test(expirationDate) || Number.isNaN(Date.parse(`${expirationDate}T00:00:00`))) {
      return fail(res, "Expiration date không hợp lệ", 400, "INVALID_EXPIRATION_DATE");
    }
    if (remarks.length > 250) {
      return fail(res, "Remarks không được vượt quá 250 ký tự", 400, "INVALID_REMARKS");
    }

    const data = await BoxLabelModel.createBoxLabel({
      modelId,
      expirationDate,
      quantity,
      remarks,
      eventUser: req.user.USERID,
    });
    return ok(res, data, "Lưu Box Label thành công", null, 201);
  } catch (error) {
    if (error.message.startsWith("Invalid ") || error.message === "Box Label QR must contain exactly 24 characters") {
      return fail(
        res,
        "Model phải có Materials Code 6 ký tự, Product 3 ký tự và Production Factory 2 ký tự",
        400,
        "INVALID_QR_SOURCE_DATA",
      );
    }
    if (error.message === "Daily Box Label sequence is out of range") {
      return fail(res, "Sequence Box Label trong ngày đã đạt giới hạn X999", 409, "SEQUENCE_LIMIT_REACHED");
    }
    return next(error);
  }
};
