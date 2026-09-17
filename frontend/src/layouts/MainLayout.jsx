import Sidebar from "./Sidebar";
import Header from "./Header";
import styles from "./MainLayout.module.css";
import { useState, useCallback, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MENU_CONFIG } from "./menuConfig.js";

export default function MainLayout() {
  const location = useLocation();

  // 1. SINGLE SOURCE OF TRUTH: Khởi tạo và giữ state duy nhất tại đây
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  // 2. Hàm xử lý logic (bao gồm cả lưu LocalStorage) được định nghĩa ở cha
  const handleToggleSidebar = useCallback(() => {
    setCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebarCollapsed", String(newState));
      return newState;
    });
  }, []);

  const handleForceOpenSidebar = useCallback(() => {
    setCollapsed(false);
    localStorage.setItem("sidebarCollapsed", "false");
  }, []);

  const activeGroup = useMemo(() => {
    return MENU_CONFIG.find(g => location.pathname.startsWith(g.path));
  }, [location.pathname]);

  const hasSidebar = activeGroup && activeGroup.items && activeGroup.items.length > 0;

  return (
    <div className={styles.layoutContainer}>
      <Header
        onToggleSidebar={handleToggleSidebar}
        onForceOpenSidebar={handleForceOpenSidebar}
        hasSidebar={hasSidebar}
      />

      <div className={styles.bodyContainer}>
        {hasSidebar && (
          <Sidebar
            isCollapsed={collapsed}
            onToggle={handleToggleSidebar}
            activeGroup={activeGroup}
          />
        )}

        <div className={styles.mainContent}>
          <div key={location.pathname} className={styles.contentArea}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}