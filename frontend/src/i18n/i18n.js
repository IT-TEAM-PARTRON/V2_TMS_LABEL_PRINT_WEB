// import i18n from "i18next";
// import { initReactI18next } from "react-i18next";
// import LanguageDetector from "i18next-browser-languagedetector";

// import en from "./en.json";
// import vi from "./vi.json";
// import kr from "./kr.json";

// // ─── 1. CODE DỌN DẸP LOCAL STORAGE (TRÁNH LỖI CHO NGƯỜI DÙNG CŨ) ───
// // Nếu phát hiện Local Storage đang lưu dạng "vi-VN" hoặc "en-US"
// // thì gọt sạch phần đuôi, chỉ giữ lại "vi" hoặc "en" trước khi i18n chạy.
// const cachedLang = localStorage.getItem("i18nextLng");
// if (cachedLang && cachedLang.includes("-")) {
//   localStorage.setItem("i18nextLng", cachedLang.split("-")[0]);
// }
// i18n
//   .use(LanguageDetector)
//   .use(initReactI18next)
//   .init({
//     resources: {
//       vi: { translation: vi },
//       en: { translation: en },
//       kr: { translation: kr },
//     },
//     fallbackLng: "en",
//     supportedLngs: ["vi", "en", "kr"],
//     load: "languageOnly",
//     interpolation: { escapeValue: false },
//     detection: {
//       order: ["localStorage"],
//       caches: ["localStorage"],
//       convertDetectedLanguage: (lng) => lng.split("-")[0], // ✅ key fix
//     },
//   });

// export default i18n;
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

// Dọn dẹp localStorage (giữ nguyên code của bạn)
const cachedLang = localStorage.getItem("i18nextLng");
if (cachedLang && cachedLang.includes("-")) {
  localStorage.setItem("i18nextLng", cachedLang.split("-")[0]);
}

i18n
  .use(HttpBackend) // Dùng backend để fetch dữ liệu
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "EN",
    supportedLngs: ["VI", "EN", "KR"],
    load: "languageOnly",
    interpolation: { escapeValue: false },
    backend: {
      // Vite proxy sẽ chuyển hướng /api/locales...
      loadPath: '/api/locales/{{lng}}',
    },
    detection: {
      order: ["localStorage"],
      caches: ["localStorage"],
      convertDetectedLanguage: (lng) => lng.split("-")[0],
    },
  });

export default i18n;