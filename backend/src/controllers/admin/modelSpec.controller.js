import ModelSpecModel from "../../models/admin/modelSpec.model.js";
import { ok, fail } from "../../middlewares/responseHandler.js";

const FIELD_LIMITS = {
  MODELID: 10,
  MATERIALSCODE: 50,
  PRODUCT: 50,
  PRODUCTFACTORY: 50,
  SUPPLIER: 50,
};

const normalizeModelData = (body, eventUser) => ({
  MODELID: String(body.MODELID || "").trim().toUpperCase(),
  MATERIALSCODE: String(body.MATERIALSCODE || "").trim(),
  PRODUCT: String(body.PRODUCT || "").trim(),
  PRODUCTFACTORY: String(body.PRODUCTFACTORY || "").trim(),
  SUPPLIER: String(body.SUPPLIER || "").trim(),
  DESCRIPTION: String(body.DESCRIPTION || "").trim(),
  EVENTUSER: eventUser,
});

const validateModelData = (data) => {
  for (const [field, maxLength] of Object.entries(FIELD_LIMITS)) {
    if (!data[field]) return `${field} là bắt buộc`;
    if (data[field].length > maxLength) return `${field} không được vượt quá ${maxLength} ký tự`;
  }
  return null;
};

export const getAllModels = async (req, res, next) => {
  try {
    return ok(res, await ModelSpecModel.getAllModels(), "Lấy danh sách Model thành công");
  } catch (error) {
    return next(error);
  }
};

export const createModel = async (req, res, next) => {
  try {
    const data = normalizeModelData(req.body, req.user.USERID);
    const validationError = validateModelData(data);
    if (validationError) return fail(res, validationError, 400, "VALIDATION_ERROR");
    if (await ModelSpecModel.getByModelId(data.MODELID)) {
      return fail(res, "MODELID đã tồn tại", 409, "DUPLICATE_MODEL_ID");
    }
    const model = await ModelSpecModel.createModel(data);
    return ok(res, model, "Thêm Model thành công", null, 201);
  } catch (error) {
    return next(error);
  }
};

export const updateModel = async (req, res, next) => {
  try {
    const data = normalizeModelData(req.body, req.user.USERID);
    const validationError = validateModelData(data);
    if (validationError) return fail(res, validationError, 400, "VALIDATION_ERROR");
    if (await ModelSpecModel.getByModelId(data.MODELID, req.params.id)) {
      return fail(res, "MODELID đã tồn tại", 409, "DUPLICATE_MODEL_ID");
    }
    const model = await ModelSpecModel.updateModel(req.params.id, data);
    if (!model) return fail(res, "Không tìm thấy Model", 404, "MODEL_NOT_FOUND");
    return ok(res, model, "Cập nhật Model thành công");
  } catch (error) {
    return next(error);
  }
};

export const deleteModel = async (req, res, next) => {
  try {
    const deleted = await ModelSpecModel.deleteModel(req.params.id, req.user.USERID);
    if (!deleted) return fail(res, "Không tìm thấy Model", 404, "MODEL_NOT_FOUND");
    return ok(res, null, "Xóa Model thành công");
  } catch (error) {
    return next(error);
  }
};
