import ZplSpecModel from "../../models/admin/zplSpec.model.js";
import { ok, fail } from "../../middlewares/responseHandler.js";

export const getAllZplSpecs = async (req, res) => {
  try {
    const zpls = await ZplSpecModel.getAllZplSpecs();
    return ok(res, zpls, "Lấy danh sách ZPL thành công");
  } catch (error) {
    console.error("Lỗi get all ZPL Specs:", error);
    return fail(res, "Lỗi Server khi lấy danh sách ZPL Spec", 500);
  }
};

export const getZplSpecByType = async (req, res) => {
  try {
    const { type } = req.params;
    const zpl = await ZplSpecModel.getZplSpecByType(type);
    if (!zpl) {
      return fail(res, "Không tìm thấy ZPL Spec cho loại này", 404);
    }
    return ok(res, zpl, "Lấy ZPL Spec thành công");
  } catch (error) {
    console.error("Lỗi get ZPL Spec by Type:", error);
    return fail(res, "Lỗi Server khi lấy ZPL Spec", 500);
  }
};

export const updateZplSpec = async (req, res) => {
  try {
    const { id } = req.params;
    const { ZPLCODE } = req.body;

    if (ZPLCODE === undefined || ZPLCODE === null) {
      return fail(res, "ZPLCODE là bắt buộc", 400);
    }

    const EVENTUSER = req.user ? req.user.USERID : "SYSTEM";

    // Kiểm tra xem record có tồn tại không
    const existing = await ZplSpecModel.getZplSpecById(id);
    if (!existing) {
      return fail(res, "Không tìm thấy ZPL Spec này", 404);
    }

    await ZplSpecModel.updateZplSpec(id, { ZPLCODE, EVENTUSER });

    return ok(res, null, "Cập nhật ZPL Code thành công");
  } catch (error) {
    console.error("Lỗi update ZPL Spec:", error);
    return fail(res, "Lỗi Server khi cập nhật ZPL Code", 500);
  }
};
