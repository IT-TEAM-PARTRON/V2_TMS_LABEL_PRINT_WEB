import { ok, fail } from "../../middlewares/responseHandler.js";
import TranslationModel from "../../models/admin/translation.model.js";
import i18nManager from "../../locales/i18n.js";

export const getAllTranslations = async (req, res) => {
  try {
    const data = await TranslationModel.getAll();
    return ok(res, data, "Success");
  } catch (err) {
    console.error("Get All Translations Error:", err);
    return fail(res, req.t("server.internalError"), 500);
  }
};

export const updateTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    await TranslationModel.update(id, req.body);

    // Cập nhật lại Cache sau khi sửa
    await i18nManager.loadTranslationsIntoMemory();

    return ok(res, null, "Updated successfully");
  } catch (err) {
    return next(err);
  }
};
export const importTranslations = async (req, res) => {
  try {
    const { translations } = req.body; // Dữ liệu từ file Excel (Array)

    // 1. Lấy dữ liệu "tươi" nhất từ Database để so sánh
    const currentData = await TranslationModel.getAll();

    // 2. Chuyển sang Map để tìm kiếm nhanh với độ phức tạp O(1)
    const dbMap = new Map(currentData.map(item => [item.ID, item]));

    // 3. LỌC DỮ LIỆU: Chỉ giữ lại những dòng có sự thay đổi thực sự
    const changedRows = translations.filter(excelRow => {
      const dbRow = dbMap.get(excelRow.ID);

      // Nếu không tìm thấy ID trong DB (người dùng thêm ID lạ trong Excel), bỏ qua
      if (!dbRow) return false;

      // So sánh giá trị: Nếu có ít nhất 1 ngôn ngữ khác biệt thì mới Update
      return (
        String(excelRow.EN) !== String(dbRow.EN) ||
        String(excelRow.VI) !== String(dbRow.VI) ||
        String(excelRow.KR) !== String(dbRow.KR)
      );
    });

    // 4. KIỂM TRA: Nếu không có gì thay đổi thì kết thúc sớm
    if (changedRows.length === 0) {
      return ok(res, null, "Không phát hiện thay đổi nào. Dữ liệu đã đồng nhất.");
    }

    // 5. BULK UPDATE: Đẩy toàn bộ danh sách đã lọc xuống DB trong 1 lần
    await TranslationModel.updateBulk(changedRows);

    // 6. RELOAD CACHE: Cập nhật i18n memory
    await i18nManager.loadTranslationsIntoMemory();

    return ok(res, null, `Đã cập nhật thành công ${changedRows.length} dòng có nội dung mới.`);

  } catch (err) {
    console.error("Import Error:", err);
    return fail(res, req.t("server.internalError"), 500);
  }
};