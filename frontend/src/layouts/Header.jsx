import styles from "./Header.module.css";
import { useAuth } from "../pages/Login/AuthContext.jsx";
import { FaSignOutAlt, FaUser, FaChevronDown, FaLock, FaBars } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher/LanguageSwitcher.jsx";
import ChangePasswordModal from "../components/Modal/ChangePasswordModal.jsx";
import { useState, useRef, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { MENU_CONFIG } from "./menuConfig.js";
import partronLogo from "../assets/icons/partron_home.png";

export default function Header({ onToggleSidebar, onForceOpenSidebar }) {
  const { t } = useTranslation();
  const { auth, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [openUser, setOpenUser] = useState(false);
  const userRef = useRef();

  const handleLogout = () => {
    void logout();
  };

  const handleChangePassword = () => {
    setOpenUser(false); // Đóng dropdown menu đi
    setIsPasswordModalOpen(true); // Mở Modal lên
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setOpenUser(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const user = auth?.userInfo;

  const normalizePermission = (value = "") =>
    value.toString().trim().toUpperCase().replace(/[\s\-_]+/g, "");

  const permissions = (auth?.userInfo?.DESCRIPTION || "")
    .split(",")
    .map((p) => normalizePermission(p))
    .filter(Boolean);

  const hasPermission = (perm) => {
    if (!perm) return true;
    if (permissions.length === 0) return false;
    return permissions.includes(normalizePermission(perm));
  };

  const handleMenuClick = (e, path, hasSub) => {
    e.preventDefault();
    if (hasSub && onForceOpenSidebar) {
      onForceOpenSidebar();
    }
    if (location.pathname === path) {
      navigate(0);
    } else {
      navigate(path);
    }
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.mobileMenuBtn} onClick={onToggleSidebar} title="Menu">
            <FaBars size={20} />
          </button>
          <Link to="/home" className={styles.logoLink}>
            <img src={partronLogo} alt="Logo" className={styles.logoImg} />
          </Link>
          {/* TOP NAVIGATION MENU */}
          <nav className={styles.topNav}>
            {MENU_CONFIG.map((group) => {
              const hasSub = group.items && group.items.length > 0;
              let targetPath = group.path;

              if (hasSub) {
                // Lọc các menu con (Level 2) xem có quyền truy cập không
                const allowedSubItems = group.items.filter(sub => {
                  const hasLevel3 = sub.items && sub.items.length > 0;
                  if (hasLevel3) {
                    return sub.items.some(level3 => hasPermission(level3.key));
                  }
                  return hasPermission(sub.key);
                });

                if (allowedSubItems.length === 0) return null;

                // Tìm đường dẫn phù hợp nhất để điều hướng tự động khi click vào Module
                const firstSub = allowedSubItems[0];
                const firstSubHasLevel3 = firstSub.items && firstSub.items.length > 0;
                
                if (firstSubHasLevel3) {
                  const allowedLevel3 = firstSub.items.filter(l3 => hasPermission(l3.key));
                  if (allowedLevel3.length > 0) {
                    targetPath = allowedLevel3[0].path;
                  } else {
                    targetPath = firstSub.path || group.path;
                  }
                } else {
                  targetPath = firstSub.path;
                }
              } else {
                if (!hasPermission(group.key)) return null;
              }

              const isActive = location.pathname.startsWith(group.path);

              return (
                <Link
                  key={group.key}
                  to={targetPath}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                  onClick={(e) => handleMenuClick(e, targetPath, hasSub)}
                >
                  <group.icon className={styles.navIcon} size={18} />
                  <span>{t(group.titleKey, group.titleFallback)}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={styles.headerRight}>
          {/* 1. LANGUAGE SWITCHER */}
          <div className={styles.headerLanguage}>
            {/* <LanguageSwitcher /> */}
          </div>

          {/* 2. USER INFO BUTTON + DROPDOWN */}
          <div className={styles.userWrapper} ref={userRef}>
            <button
              className={`${styles.userBtn} ${openUser ? styles.userBtnActive : ""}`}
              onClick={() => setOpenUser(!openUser)}
            >
              <div className={styles.userIconWrapper}>
                <FaUser className={styles.userIcon} />
              </div>
              <span className={styles.userNameText}>{user?.FULLNAME || "Guest"}</span>
              <FaChevronDown className={`${styles.userArrow} ${openUser ? styles.userArrowOpen : ""}`} />
            </button>

            <div className={`${styles.userDropdown} ${openUser ? styles.userDropdownShow : ""}`}>
              <div className={styles.userDropdownHeader}>
                <div className={styles.userAvatar}>
                  {(user?.FULLNAME?.charAt(0) || "G").toUpperCase()}
                </div>
                <div className={styles.userInfoText}>
                  <div className={styles.userDropdownName}>{user?.FULLNAME || "Guest"}</div>
                </div>
              </div>

              <div className={styles.userDropdownDivider} />

              <div className={styles.userDropdownInfo}>
                <div className={styles.userDropdownRow}>
                  <span className={styles.userDropdownLabel}>Username</span>
                  <span className={styles.userDropdownValue}>{user?.FULLNAME || "—"}</span>
                </div>
                <div className={styles.userDropdownRow}>
                  <span className={styles.userDropdownLabel}>Role</span>
                  <span className={styles.userDropdownValue}>{user?.ROLEID || "—"}</span>
                </div>
              </div>

              <div className={styles.userDropdownDivider} />

              {/* ── NÚT ĐỔI MẬT KHẨU ── */}
              <div className={styles.userDropdownFooter}>
                <button className={styles.changePassBtn} onClick={handleChangePassword}>
                  <FaLock size={12} />
                  <span>{t("header.change_password")}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. LOGOUT BUTTON (CHỈ HIỆN ICON) */}
          <div className={styles.dividerVertical} />
          <button
            className={styles.logoutBtn}
            onClick={handleLogout}
            title={t("header.logout")}
          >
            <FaSignOutAlt size={20} />
          </button>

        </div>
      </header>
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        user={user} // Truyền thông tin user hiện tại vào Modal
      />
    </>

  );
}
