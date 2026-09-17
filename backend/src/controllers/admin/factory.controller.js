import { ok, fail } from "../../middlewares/responseHandler.js";
import FactoryModel from "../../models/admin/factory.model.js";

// Lấy toàn bộ danh sách Factory
export const getAllFactories = async (req, res, next) => {
  try {
    const factories = await FactoryModel.getAllFactories();
    return ok(res, factories, "Success");
  } catch (err) {
    console.error("Get All Factories Error:", err);
    return fail(res, req.t("server.internalError"), 500);
  }
};

// Tạo mới Factory
export const createFactory = async (req, res, next) => {
  try {
    const { FACTORYID, DESCRIPTION } = req.body;

    if (!FACTORYID || !FACTORYID.trim()) {
      return fail(res, req.t("factory.factoryRequired"), 400);
    }

    // Kiểm tra trùng FACTORYID
    const existing = await FactoryModel.getByFactoryId(FACTORYID.trim());
    if (existing) {
      return fail(res, req.t("factory.duplicateData"), 409);
    }

    const newFactory = await FactoryModel.createFactory({
      FACTORYID: FACTORYID.trim(),
      DESCRIPTION: DESCRIPTION || "",
    });

    if (!newFactory) {
      return fail(res, req.t("factory.creationFailed"), 400);
    }

    return ok(res, newFactory, req.t("factory.createSuccess"));
  } catch (err) {
    console.error("Create Factory Error:", err);
    return next(err);
  }
};

// Cập nhật Factory
export const updateFactory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { FACTORYID, DESCRIPTION } = req.body;

    if (!FACTORYID || !FACTORYID.trim()) {
      return fail(res, req.t("factory.factoryRequired"), 400);
    }

    // Kiểm tra trùng
    const existing = await FactoryModel.getByFactoryId(FACTORYID.trim());
    if (existing && Number(existing.ID) !== Number(id)) {
      return fail(res, req.t("factory.duplicateData"), 409);
    }

    const updatedFactory = await FactoryModel.updateFactory(id, {
      FACTORYID: FACTORYID.trim(),
      DESCRIPTION: DESCRIPTION || "",
    });

    if (!updatedFactory) {
      return fail(res, req.t("factory.factoryNotFound"), 404);
    }

    return ok(res, updatedFactory, req.t("factory.updateSuccess"));
  } catch (err) {
    console.error("Update Factory Error:", err);
    return next(err);
  }
};

// Xóa Factory
export const deleteFactory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isDeleted = await FactoryModel.deleteFactory(id);

    if (!isDeleted) {
      return fail(res, req.t("factory.factoryNotFound"), 404);
    }

    return ok(res, null, req.t("factory.deleteSuccess"));
  } catch (err) {
    console.error("Delete Factory Error:", err);
    return next(err);
  }
};
