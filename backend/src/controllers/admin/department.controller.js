import { ok, fail } from "../../middlewares/responseHandler.js";
import DepartmentModel from "../../models/admin/department.model.js";

// Lấy toàn bộ danh sách Department
export const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await DepartmentModel.getAllDepartments();
    return ok(res, departments, "Success");
  } catch (err) {
    console.error("Get All Departments Error:", err);
    return fail(res, req.t("server.internalError"), 500);
  }
};

// Lấy danh sách Department theo FACTORYID (dùng cho Dropdown lọc)
export const getDepartmentsByFactory = async (req, res, next) => {
  try {
    const { factoryId } = req.params;
    const departments = await DepartmentModel.getDepartmentsByFactory(factoryId);
    return ok(res, departments, "Success");
  } catch (err) {
    console.error("Get Departments By Factory Error:", err);
    return fail(res, req.t("server.internalError"), 500);
  }
};

// Tạo mới Department
export const createDepartment = async (req, res, next) => {
  try {
    const { FACTORYID, DEPARTMENTID } = req.body;
    const EVENTUSER = req.user.USERID;

    if (!FACTORYID || !FACTORYID.trim() || !DEPARTMENTID || !DEPARTMENTID.trim()) {
      return fail(res, req.t("department.departmentRequired"), 400);
    }

    // Kiểm tra trùng cặp (FACTORYID, DEPARTMENTID)
    const existing = await DepartmentModel.getByUniqueKey(FACTORYID.trim(), DEPARTMENTID.trim());
    if (existing) {
      return fail(res, req.t("department.duplicateData"), 409);
    }

    const newDept = await DepartmentModel.createDepartment({
      FACTORYID: FACTORYID.trim(),
      DEPARTMENTID: DEPARTMENTID.trim(),
      EVENTUSER,
    });

    if (!newDept) {
      return fail(res, req.t("department.creationFailed"), 400);
    }

    return ok(res, newDept, req.t("department.createSuccess"));
  } catch (err) {
    console.error("Create Department Error:", err);
    return fail(res, req.t("server.internalError"), 500);
  }
};

// Cập nhật Department
export const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { FACTORYID, DEPARTMENTID } = req.body;
    const EVENTUSER = req.user.USERID;

    if (!FACTORYID || !FACTORYID.trim() || !DEPARTMENTID || !DEPARTMENTID.trim()) {
      return fail(res, req.t("department.departmentRequired"), 400);
    }

    // Kiểm tra trùng
    const existing = await DepartmentModel.getByUniqueKey(FACTORYID.trim(), DEPARTMENTID.trim());
    if (existing && Number(existing.ID) !== Number(id)) {
      return fail(res, req.t("department.duplicateData"), 409);
    }

    const updatedDept = await DepartmentModel.updateDepartment(id, {
      FACTORYID: FACTORYID.trim(),
      DEPARTMENTID: DEPARTMENTID.trim(),
      EVENTUSER,
    });

    if (!updatedDept) {
      return fail(res, req.t("department.departmentNotFound"), 404);
    }

    return ok(res, updatedDept, req.t("department.updateSuccess"));
  } catch (err) {
    console.error("Update Department Error:", err);
    return fail(res, req.t("server.internalError"), 500);
  }
};

// Xóa Department
export const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isDeleted = await DepartmentModel.deleteDepartment(id);

    if (!isDeleted) {
      return fail(res, req.t("department.departmentNotFound"), 404);
    }

    return ok(res, null, req.t("department.deleteSuccess"));
  } catch (err) {
    console.error("Delete Department Error:", err);
    return next(err);
  }
};
