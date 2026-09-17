import { FaBan, FaHome } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./AccessDenied.module.css";

const fallbackContent = {
  VI: {
    title: "Không có quyền truy cập",
    message:
      "Bạn không có quyền xem trang này. Vui lòng liên hệ quản trị viên nếu bạn cần được cấp quyền.",
    goHome: "Quay về trang chủ",
  },
  EN: {
    title: "Access denied",
    message:
      "You do not have permission to view this page. Please contact an administrator if you need access.",
    goHome: "Back to home",
  },
  KR: {
    title: "접근 권한이 없습니다",
    message:
      "이 페이지를 볼 권한이 없습니다. 접근 권한이 필요한 경우 관리자에게 문의하세요.",
    goHome: "홈으로 돌아가기",
  },
};

export default function AccessDenied() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const attemptedPath = location.state?.attemptedPath;
  const language = (i18n.resolvedLanguage || i18n.language || "EN")
    .split("-")[0]
    .toUpperCase();
  const fallback = fallbackContent[language] || fallbackContent.EN;

  return (
    <main className={styles.container}>
      <section className={styles.card} aria-labelledby="access-denied-title">
        <div className={styles.icon} aria-hidden="true">
          <FaBan />
        </div>
        <p className={styles.code}>403</p>
        <h1 id="access-denied-title">
          {t("access_denied.title", { defaultValue: fallback.title })}
        </h1>
        <p className={styles.message}>
          {t("access_denied.message", { defaultValue: fallback.message })}
        </p>
        {attemptedPath && <code className={styles.path}>{attemptedPath}</code>}
        <button type="button" onClick={() => navigate("/home", { replace: true })}>
          <FaHome aria-hidden="true" />
          {t("access_denied.go_home", { defaultValue: fallback.goHome })}
        </button>
      </section>
    </main>
  );
}
