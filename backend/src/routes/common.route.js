import express from "express";
import i18nManager from "../locales/i18n.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

//---------------- Time Sync Route ----------------
router.get('/time/sync', (req, res) => {
    // Trả về thời gian hiện tại của Server (milliseconds)
    res.json({ serverTime: Date.now() });
});

//---------------- Translation Routes ----------------
/**
 * @route   GET /api/locales/:lang
 * @desc    Lấy toàn bộ bản dịch của một ngôn ngữ (vi, en, kr)
 * @access  Public
 */
router.get("/locales/:lang", (req, res) => {
    const { lang } = req.params;
    const data = i18nManager.getTranslationsByLang(lang);

    // Trả về object rỗng nếu không tìm thấy để tránh lỗi Frontend
    if (Object.keys(data).length === 0) {
        return res.status(404).json({ message: "Language not found" });
    }

    res.json(data);
});

/**
 * @route   POST /api/locales/refresh
 * @desc    Nạp lại dữ liệu từ Database vào RAM (dùng sau khi Admin sửa bản dịch)
 * @access  Private (Nên có authMiddleware ở đây)
 */
router.post("/locales/refresh", async (req, res) => {
    try {
        await i18nManager.loadTranslationsIntoMemory();
        res.json({ success: true, message: "Cache refreshed successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
export default router;