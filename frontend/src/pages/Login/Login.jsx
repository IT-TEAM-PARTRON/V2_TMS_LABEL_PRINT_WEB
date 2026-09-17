import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../api/auth/login.js";
import { useAuth } from "./AuthContext.jsx";
import styles from "./Login.module.css"; // ✅ đổi sang module
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import bgLogin from "../../assets/icons/bg_login.png";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/LanguageSwitcher/LanguageSwitcher.jsx";
import { MENU_CONFIG } from "../../layouts/menuConfig.js";
export default function Login() {
  const [email, setEmail] = useState(
    () => localStorage.getItem("rememberedTMS") || "",
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    () => Boolean(localStorage.getItem("rememberedTMS")),
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "Login";
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const response = await loginUser({ EMAIL: email, PASSWORD: password });
      const { success, data, message } = response.data;

      if (!success) {
        setErrorMsg(message || "Đăng nhập thất bại.");
        return;
      }

      if (rememberMe) localStorage.setItem("rememberedTMS", email);
      else localStorage.removeItem("rememberedTMS");

      login({ userInfo: data });

      const permissions = (data?.DESCRIPTION || "");
      const normalizePermission = (value = "") =>
        value.toString().trim().toUpperCase().replace(/[\s\-_]+/g, "");

      const permissionsList = permissions
        .split(",")
        .map(normalizePermission)
        .filter(Boolean);

      if (permissionsList.length === 0) {
        navigate("/home");
      } else {
        const findFirstPermittedPath = (items) => {
          for (const item of items) {
            if (item.items && item.items.length > 0) {
              const path = findFirstPermittedPath(item.items);
              if (path) return path;
            } else {
              if (permissionsList.includes(normalizePermission(item.key))) {
                return item.path;
              }
            }
          }
          return null;
        };

        const foundPath = findFirstPermittedPath(MENU_CONFIG);
        navigate(foundPath || "/home");
      }
    } catch (err) {
      if (err.response && err.response.status > 500) {
        setErrorMsg(t("general_error.connecttion_error"));
      } else {
        setErrorMsg(err.response?.data?.message || t("general_error.unknown_error"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={styles.loginBackground}
      style={{ backgroundImage: `url(${bgLogin})` }}
    >
      <div className={styles.loginBox}>
        <form className={styles.loginForm} onSubmit={handleLogin}>
          <h1 className={styles.loginTitle}>{t("login.title")}</h1>

          <div className={styles.inputGroup}>
            <span className={styles.icon}>
              <FaUser />
            </span>
            <input
              type="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t("login.email")}
              autoComplete="email"
            />
          </div>

          <div className={styles.inputGroup}>
            <span className={styles.icon}>
              <FaLock />
            </span>

            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={t("login.password")}
              autoComplete="current-password"
            />

            <span
              className={styles.icon}
              onClick={() => setShowPassword((prev) => !prev)}
              title={
                showPassword
                  ? t("login.hide_password")
                  : t("login.show_password")
              }
              style={{ cursor: "pointer" }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <div className={styles.loginRow}>
            {/* LEFT */}
            <div className={styles.loginOptions}>
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                {t("login.remember_me")}
              </label>
            </div>

            {/* RIGHT */}
            <div className={styles.loginLanguage}>
              <LanguageSwitcher theme="dark" />
            </div>
          </div>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? t("login.signing_in") : t("login.sign_in")}
          </button>

          {errorMsg && <div className={styles.error}>{errorMsg}</div>}
        </form>
      </div>
    </div>
  );
}
