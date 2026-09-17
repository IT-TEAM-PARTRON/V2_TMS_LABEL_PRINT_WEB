// import { vi } from './vi.js';
// import { en } from './en.js';

// // Available languages
// const languages = {
//   vi,
//   en,
// };

// // Default language
// const DEFAULT_LANG = 'vi';

// /**
//  * Get translation by key and language
//  * @param {string} key - Translation key (e.g., 'auth.loginSuccessful')
//  * @param {string} lang - Language code ('vi' or 'en')
//  * @param {object} params - Optional parameters for string interpolation
//  * @returns {string} - Translated text
//  */
// export function t(key, lang = DEFAULT_LANG, params = {}) {
//   // Validate language
//   if (!languages[lang]) {
//     console.warn(`Language not supported: ${lang}, falling back to ${DEFAULT_LANG}`);
//     lang = DEFAULT_LANG;
//   }

//   const keys = key.split('.');
//   let translation = languages[lang];

//   for (const k of keys) {
//     if (translation && translation[k]) {
//       translation = translation[k];
//     } else {
//       console.warn(`Translation key not found: ${key} for language: ${lang}`);
//       return key;
//     }
//   }

//   // String interpolation for parameters like {field}
//   if (typeof translation === 'string' && Object.keys(params).length > 0) {
//     return translation.replace(/\{(\w+)\}/g, (match, key) => {
//       return params[key] !== undefined ? params[key] : match;
//     });
//   }

//   return translation;
// }

// /**
//  * Get translation from request language (from header or default)
//  * @param {Request} req - Express request object
//  * @param {string} key - Translation key
//  * @param {object} params - Optional parameters
//  * @returns {string} - Translated text
//  */
// export function tr(req, key, params = {}) {
//   // Get language from:
//   // 1. Request header 'Accept-Language'
//   // 2. Query parameter 'lang'
//   // 3. Body parameter 'lang'
//   // 4. Default language
//   const lang =
//     req.headers['accept-language'];

//   return t(key, lang, params);
// }

// /**
//  * Create response object with translation
//  * @param {Request} req - Express request object
//  * @param {string} key - Translation key
//  * @param {object} params - Optional parameters
//  * @param {object} data - Additional response data
//  * @returns {object} - Response object
//  */
// export function response(req, key, params = {}, data = {}) {
//   const message = tr(req, key, params);
//   return {
//     message,
//     ...data,
//   };
// }

// /**
//  * Send success response with translation
//  * @param {Response} res - Express response object
//  * @param {Request} req - Express request object
//  * @param {string} key - Translation key
//  * @param {object} data - Response data
//  * @param {number} status - HTTP status code (default: 200)
//  */
// export function success(res, req, key, data = {}, status = 200) {
//   const message = tr(req, key);
//   res.status(status).json({
//     success: true,
//     message,
//     ...data,
//   });
// }

// /**
//  * Send error response with translation
//  * @param {Response} res - Express response object
//  * @param {Request} req - Express request object
//  * @param {string} key - Translation key
//  * @param {number} status - HTTP status code (default: 400)
//  * @param {object} params - Optional parameters
//  */
// export function error(res, req, key, status = 400, params = {}) {
//   const message = tr(req, key, params);
//   res.status(status).json({
//     success: false,
//     message,
//   });
// }

// /**
//  * Middleware to detect and set language from request
//  */
// export function i18nMiddleware(req, res, next) {
//   // Attach translation function to request object
//   req.t = (key, params = {}) => tr(req, key, params);

//   // Attach response helpers to request
//   req.success = (key, data = {}, status = 200) => success(res, req, key, data, status);
//   req.error = (key, status = 400, params = {}) => error(res, req, key, status, params);

//   next();
// }

// /**
//  * Get all available languages
//  * @returns {Array} - Array of language codes
//  */
// export function getAvailableLanguages() {
//   return Object.keys(languages);
// }

// /**
//  * Check if language is supported
//  * @param {string} lang - Language code
//  * @returns {boolean}
//  */
// export function isLanguageSupported(lang) {
//   return languages.hasOwnProperty(lang);
// }

// export default {
//   t,
//   tr,
//   response,
//   success,
//   error,
//   i18nMiddleware,
//   getAvailableLanguages,
//   isLanguageSupported,
// };
import TranslationModel from "../models/admin/translation.model.js";
let translationCache = {};

/**
 * Chuyển đổi từ dữ liệu bảng sang Object lồng nhau cho i18next
 * Từ: { "login.title": "Chào mừng" } -> { login: { title: "Chào mừng" } }
 */
const unflatten = (data) => {
  const result = {};
  for (const key in data) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = data[key];
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    }
  }
  return result;
};

/**
 * Nạp bản dịch từ DB vào RAM
 */
export async function loadTranslationsIntoMemory() {
  try {
    const rows = await TranslationModel.getAll();

    const viRaw = {},
      enRaw = {},
      krRaw = {};
    rows.forEach((row) => {
      // QUAN TRỌNG: Lấy key từ cột description thay vì key_name
      const key = row.DESCRIPTION?.trim(); // Sử dụng DESCRIPTION làm key, và loại bỏ khoảng trắng thừa
      if (key) {
        viRaw[key] = row.VI || "";
        enRaw[key] = row.EN || "";
        krRaw[key] = row.KR || "";
      }
    });

    translationCache = {
      VI: unflatten(viRaw),
      EN: unflatten(enRaw),
      KR: unflatten(krRaw),
    };
    console.log("✅ [i18n] Đã nạp lại languages vào RAM cache.");
  } catch (error) {
    console.error("❌ [i18n] Lỗi:", error);
  }
}

// Hàm lấy bản dịch cho Backend (để trả về thông báo lỗi, v.v.)
export function t(key, lang = "VI", params = {}) {
  const supportedLangs = ["VI", "EN", "KR"];
  if (!supportedLangs.includes(lang)) lang = "VI";

  const keys = key.split(".");
  let translation = translationCache[lang];

  for (const k of keys) {
    if (translation && translation[k] !== undefined) {
      translation = translation[k];
    } else {
      return key;
    }
  }

  if (typeof translation === "string" && Object.keys(params).length > 0) {
    return translation.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }
  return translation;
}

// Middleware để gắn vào Express (Như bạn đã dùng trong server.js)
export function i18nMiddleware(req, res, next) {
  const lang = req.headers["accept-language"] || "VI";
  req.lang = lang; // Gắn ngôn ngữ vào request
  req.t = (key, params = {}) => t(key, lang, params);
  next();
}

// Hàm getter để lấy dữ liệu cho API
export const getTranslationsByLang = (lang) => translationCache[lang] || {};

export default {
  loadTranslationsIntoMemory,
  t,
  i18nMiddleware,
  getTranslationsByLang,
};
