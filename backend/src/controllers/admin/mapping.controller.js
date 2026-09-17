import { ok, fail } from "../../middlewares/responseHandler.js";
import MappingModel from "../../models/admin/mapping.model.js";

/**
 * Cập nhật quyền (Permissions) cho một Role
 */
export const updateRolePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body; // Thống nhất dùng tên permissions thay cho description
    const event_user = req.user.USERID;

    // 1. Kiểm tra đầu vào
    if (permissions === undefined || permissions === null) {
      return fail(res, req.t("mapping.permissionRequired"), 400);
    }

    // 2. Gọi model xử lý cập nhật
    const updatedMapping = await MappingModel.updatePermission(id, {
      permissions,
      event_user
    });

    // 3. Kiểm tra kết quả trả về từ model
    if (!updatedMapping) {
      return fail(res, req.t("mapping.roleNotFound"), 404);
    }

    // 4. Phản hồi thành công kèm dữ liệu đã cập nhật
    return ok(res, updatedMapping, req.t("mapping.updateSuccess"));

  } catch (err) {
    console.error("Update Role Permission Error:", err);

    // Trả về lỗi server hệ thống
    return fail(res, req.t("server.internalError"), 500);
  }
};

/**
 * (Bổ sung thêm nếu cần) Lấy thông tin mapping của một Role
 */
export const getMappingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mapping = await MappingModel.getMappingById(id);

    if (!mapping) {
      return fail(res, req.t("mapping.roleNotFound"), 404);
    }

    return ok(res, mapping, "Success");
  } catch (err) {
    console.error("Get Mapping By Id Error:", err);
    return fail(res, req.t("server.internalError"), 500);
  }
};