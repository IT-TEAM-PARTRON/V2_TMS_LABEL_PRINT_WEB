import ReprintLabelModel from "../../models/packing/reprintLabel.model.js";
import { fail, ok } from "../../middlewares/responseHandler.js";

const readBoxQr = (req) => String(req.body.code || "").trim();

const validateBoxQr = (res, boxQr) => {
  if (!boxQr || boxQr.length > 26) {
    fail(res, "Box QR is invalid", 400, "INVALID_BOX_QR");
    return false;
  }
  return true;
};

export const lookupBoxLabelReprint = async (req, res, next) => {
  try {
    const boxQr = readBoxQr(req);
    if (!validateBoxQr(res, boxQr)) return;

    const result = await ReprintLabelModel.lookupBoxLabel(boxQr);
    if (!result) {
      return fail(
        res,
        "Box Label QR was not found",
        404,
        "BOX_LABEL_NOT_FOUND",
      );
    }

    if (!result.ZPLCODE) {
      return fail(
        res,
        "ZPL BOX_LABEL 300DPI was not found",
        404,
        "ZPL_TEMPLATE_NOT_FOUND",
      );
    }

    return ok(
      res,
      {
        record: result,
        reprintCount: result.REPRINTCOUNT,
      },
      "Box Label information retrieved successfully",
    );
  } catch (error) {
    return next(error);
  }
};

export const logBoxLabelReprint = async (req, res, next) => {
  try {
    const boxQr = readBoxQr(req);
    if (!validateBoxQr(res, boxQr)) return;

    const result = await ReprintLabelModel.logBoxLabelReprint({
      boxQr,
      eventUser: req.user.USERID,
    });
    if (!result) {
      return fail(
        res,
        "Box Label QR was not found",
        404,
        "BOX_LABEL_NOT_FOUND",
      );
    }

    return ok(res, result, "Reprint history saved successfully", null, 201);
  } catch (error) {
    return next(error);
  }
};
