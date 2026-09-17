import { ok, fail } from "../../middlewares/responseHandler.js";
import RoleModel from "../../models/admin/role.model.js";

// Lấy toàn bộ danh sách Role
export const getAllRoles = async (req, res, next) => {
    try {
        const roles = await RoleModel.getAllRoles();
        if (!roles) {
            return fail(res, req.t("role.noRoles"), 404);
        }
        return ok(res, roles, "Success");
    } catch (err) {
        console.error("Get All Roles Error:", err);
        return next(err);
    }
};

// Lấy Role theo ID (Khóa chính)
export const getRoleById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const role = await RoleModel.getRoleById(id);
        if (!role) {
            return fail(res, req.t("role.roleNotFound"), 404);
        }
        return ok(res, role, "Success");
    } catch (err) {
        console.error("Get Role By Id Error:", err);
        return next(err);
    }
};

// Tạo mới Role
export const createRole = async (req, res, next) => {
    try {
        const { ROLEID, DESCRIPTION } = req.body;
        const EVENTUSER = req.user.USERID;

        if (!ROLEID || !ROLEID.trim()) {
            return fail(res, req.t("role.roleRequired"), 400);
        }

        // Kiểm tra trùng tên Role (ROLEID)
        const existing = await RoleModel.getRoleByUniqueName(ROLEID.trim());
        if (existing) {
            return fail(res, req.t("role.duplicateData"), 409);
        }

        const newRole = await RoleModel.createRole({
            ROLEID: ROLEID.trim(),
            DESCRIPTION: DESCRIPTION || "",
            EVENTUSER
        });

        if (!newRole) {
            return fail(res, req.t("role.creationFailed"), 400);
        }

        return ok(res, newRole, req.t("role.createSuccess"));
    } catch (err) {
        console.error("Create Role Error:", err);
        return next(err);
    }
};

// Cập nhật Role
export const updateRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { ROLEID, DESCRIPTION } = req.body;
        const EVENTUSER = req.user.USERID;

        if (!ROLEID || !ROLEID.trim()) {
            return fail(res, req.t("role.roleRequired"), 400);
        }

        // Kiểm tra xem tên Role mới có bị trùng với Role khác không
        const existing = await RoleModel.getRoleByUniqueName(ROLEID.trim());
        if (existing && Number(existing.ID) !== Number(id)) {
            return fail(res, req.t("role.duplicateData"), 409);
        }

        const updatedRole = await RoleModel.updateRole(id, {
            ROLEID: ROLEID.trim(),
            DESCRIPTION: DESCRIPTION || "",
            EVENTUSER
        });

        if (!updatedRole) {
            return fail(res, req.t("role.roleNotFound"), 404);
        }

        return ok(res, updatedRole, req.t("role.updateSuccess"));
    } catch (err) {
        console.error("Update Role Error:", err);
        return next(err);
    }
};

// Xóa Role
export const deleteRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const isDeleted = await RoleModel.deleteRole(id);

        if (!isDeleted) {
            return fail(res, req.t("role.roleNotFound"), 404);
        }

        return ok(res, null, req.t("role.deleteSuccess"));
    } catch (err) {
        console.error("Delete Role Error:", err);
        return next(err);
    }
};