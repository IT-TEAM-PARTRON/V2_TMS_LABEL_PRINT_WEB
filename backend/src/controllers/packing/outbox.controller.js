import BoxLabelModel from "../../models/packing/outbox.model.js";
import { fail, ok } from "../../middlewares/responseHandler.js";
import { isValidLotNo } from "../../utils/boxLabel.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SUPPORTED_DENSITIES = ["203DPI", "300DPI"];

const normalizeDensity = (value) => String(value || "203DPI").toUpperCase();

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getBoxLabelModels = async (_req, res, next) => {
  try {
    return ok(res, await BoxLabelModel.getModels(), "Models retrieved successfully");
  } catch (error) {
    return next(error);
  }
};

export const getBoxLabelTemplate = async (req, res, next) => {
  try {
    const zplType = String(req.params.type || "").toUpperCase();
    const zplDensity = normalizeDensity(req.query.density);

    if (!["BOX_LABEL", "BOX_LABEL_TEST"].includes(zplType)) {
      return fail(res, "ZPL Type is invalid", 400, "INVALID_ZPL_TYPE");
    }
    if (!SUPPORTED_DENSITIES.includes(zplDensity)) {
      return fail(res, "ZPL Density is invalid", 400, "INVALID_ZPL_DENSITY");
    }

    const template = await BoxLabelModel.getTemplate(zplType, zplDensity);
    if (!template) {
      return fail(
        res,
        `ZPL ${zplType} ${zplDensity} was not found`,
        404,
        "ZPL_TEMPLATE_NOT_FOUND",
      );
    }
    return ok(res, template, "ZPL template retrieved successfully");
  } catch (error) {
    return next(error);
  }
};

export const createBoxLabel = async (req, res, next) => {
  try {
    const modelId = Number(req.body.modelId);
    const quantityInput = String(req.body.quantity ?? "").trim();
    const quantity = Number(quantityInput);
    const lotNo = String(req.body.lotNo || "").trim().toUpperCase();
    const expirationDate = String(req.body.expirationDate || "").trim();
    const remarks = String(req.body.remarks || "").trim();
    const zplDensity = normalizeDensity(req.body.density);

    if (!Number.isInteger(modelId) || modelId < 1) {
      return fail(res, "Model is invalid", 400, "INVALID_MODEL");
    }
    if (!/^\d{1,5}$/.test(quantityInput) || !Number.isInteger(quantity) || quantity < 1) {
      return fail(
        res,
        "Quantity must be a positive integer with no more than 5 digits",
        400,
        "INVALID_QUANTITY",
      );
    }
    if (!isValidLotNo(lotNo)) {
      return fail(
        res,
        "Lot No. must follow the YYMD-X999 standard, for example 268B-X001",
        400,
        "INVALID_LOT_NO",
      );
    }
    if (
      !DATE_PATTERN.test(expirationDate) ||
      Number.isNaN(Date.parse(`${expirationDate}T00:00:00`))
    ) {
      return fail(
        res,
        "Expiration date is invalid",
        400,
        "INVALID_EXPIRATION_DATE",
      );
    }
    if (expirationDate <= getToday()) {
      return fail(
        res,
        "Expiration date must be in the future",
        400,
        "EXPIRATION_DATE_NOT_FUTURE",
      );
    }
    if (!SUPPORTED_DENSITIES.includes(zplDensity)) {
      return fail(res, "ZPL Density is invalid", 400, "INVALID_ZPL_DENSITY");
    }
    if (remarks.length > 250) {
      return fail(
        res,
        "Remarks must not exceed 250 characters",
        400,
        "INVALID_REMARKS",
      );
    }

    const data = await BoxLabelModel.createBoxLabel({
      modelId,
      lotNo,
      expirationDate,
      quantity,
      remarks,
      zplDensity,
      eventUser: req.user.USERID,
    });
    return ok(res, data, "Box Label saved successfully", null, 201);
  } catch (error) {
    if (
      error.message.startsWith("Invalid ") ||
      error.message === "Box Label QR must contain exactly 24 characters"
    ) {
      return fail(
        res,
        "Materials Code, Product or Production Factory has an invalid length",
        400,
        "INVALID_QR_SOURCE_DATA",
      );
    }
    if (error.code === "ER_DUP_ENTRY") {
      const isLotNoDuplicate = String(error.sqlMessage || error.message).includes(
        "LOT_NO",
      );
      return fail(
        res,
        isLotNoDuplicate ? "Lot No. already exists" : "Box Label QR already exists",
        409,
        isLotNoDuplicate ? "LOT_NO_DUPLICATED" : "BOX_LABEL_QR_DUPLICATED",
      );
    }
    return next(error);
  }
};
