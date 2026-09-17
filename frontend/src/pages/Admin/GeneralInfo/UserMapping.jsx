import { useState, useEffect, useMemo, useCallback } from "react";
import CustomSection from "../../../components/Section/CustomSection.jsx";
import CustomAlertModal from "../../../components/Modal/CustomAlertModal.jsx";
import CustomTable from "../../../components/Table/CustomTable.jsx";
import styles from "./UserMapping.module.css";
import {
  TbListDetails,
  TbUserEdit,
  TbSearch,
  TbX,
  TbDeviceFloppy,
  TbRestore,
  TbChevronRight,
  TbChevronDown,
  TbCheck,
  TbRefresh,
} from "react-icons/tb";

import { getRoles, updateRolePermission } from "../../../api/admin/generalApi.js";
import { useTranslation } from "react-i18next";
import { MENU_CONFIG } from "../../../layouts/menuConfig.js";

export default function UserMapping() {
  const { t } = useTranslation();

  // Hàm chuẩn hóa chuỗi permission (giống bên Sidebar.jsx) để đối chiếu
  const normalizePermission = (value = "") =>
    value.toString().trim().toUpperCase().replace(/[\s\-_]+/g, "");

  // Tạo map từ normalizedKey -> originalKey (từ MENU_CONFIG) để map ngược data từ DB lên form
  const originalKeysMap = useMemo(() => {
    const map = {};
    const extract = (list) => {
      list.forEach(i => {
        map[normalizePermission(i.key)] = i.key;
        if (i.items && i.items.length > 0) extract(i.items);
      });
    };
    extract(MENU_CONFIG);
    return map;
  }, []);

  // Dùng trực tiếp MENU_CONFIG để giữ nguyên cấu trúc phân cấp (3 cấp)
  const PERMISSION_GROUPS = MENU_CONFIG;

  // Lấy danh sách các key con cuối cùng (leaf) của một menu
  const getLeafKeys = (node) => {
    if (!node.items || node.items.length === 0) return [node.key];
    let keys = [];
    node.items.forEach(child => {
      keys = keys.concat(getLeafKeys(child));
    });
    return keys;
  };

  // Kiểm tra trạng thái Checkbox của một Menu: 0=Trống, 1=Bán phần, 2=Đầy đủ
  const getNodeState = (node) => {
    if (!node.items || node.items.length === 0) return perms[node.key] ? 2 : 0;
    const leafKeys = getLeafKeys(node);
    const checkedCount = leafKeys.filter(k => perms[k]).length;
    if (checkedCount === 0) return 0;
    if (checkedCount === leafKeys.length) return 2;
    return 1;
  };

  // Xử lý Check / Uncheck toàn bộ các con bên trong
  const handleToggleNode = (e, node) => {
    if (e) e.stopPropagation();
    const leafKeys = getLeafKeys(node);
    const state = getNodeState(node);
    const nextChecked = state !== 2; // Nếu chưa check full -> check tất cả. Nếu đã full -> bỏ check tất cả

    setPerms(prev => {
      const next = { ...prev };
      leafKeys.forEach(k => {
        if (!isDisabledPermission(k)) next[k] = nextChecked;
      });
      return next;
    });
  };

  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [perms, setPerms] = useState({});
  const [savedPerms, setSavedPerms] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: "success", title: "", message: "" });

  const isDisabledPermission = (key) => key === "ADMIN_USER" && selectedRole?.ROLEID === "ADMIN";
  const showAlert = useCallback(
    (type, title, message) =>
      setAlertModal({ isOpen: true, type, title, message }),
    [],
  );

  const fetchRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getRoles();
      const { success, data, message } = response.data;
      if (!success) throw new Error(message);
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      showAlert("error", t("message.title_fetch_error"), err.message);
    } finally {
      setIsLoading(false);
    }
  }, [showAlert, t]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const filteredRoles = useMemo(() => {
    if (!searchTerm) return roles;
    const lw = searchTerm.toLowerCase();
    return roles.filter((r) => r.ROLEID?.toLowerCase().includes(lw));
  }, [roles, searchTerm]);

  const handleClearForm = () => {
    setSelectedRole(null);
    setPerms({});
    setSavedPerms({});
    setExpandedMenus({});
  };

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    const parsedPerms = {};
    if (role.DESCRIPTION) {
      role.DESCRIPTION.split(",").forEach((p) => {
        const normKey = normalizePermission(p);
        const origKey = originalKeysMap[normKey] || p.trim(); // Khôi phục lại key chuẩn nếu DB bị mất dấu _
        if (origKey) parsedPerms[origKey] = true;
      });
    }

    // Đảm bảo Role ADMIN luôn được gán cứng quyền ADMIN_USER
    if (role.ROLEID === "ADMIN") {
      parsedPerms["ADMIN_USER"] = true;
    }

    setPerms(parsedPerms);
    setSavedPerms(parsedPerms);
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    try {
      setIsSaving(true);
      const DESCRIPTION = Object.entries(perms)
        .filter(([, value]) => value).map(([key]) => key).join(",");
      await updateRolePermission(selectedRole.ID, DESCRIPTION);
      setSavedPerms({ ...perms });
      showAlert("success", t("admin_users.success"), t("mapping.updateSuccess"));
      await fetchRoles();
    } catch (err) {
      showAlert("error", t("admin_users.error"), err.response?.data?.message || err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    {
      key: "no",
      title: t("table.no", "NO"),
      align: "center",
      width: "60px",
      render: (_, idx) => String(idx + 1).padStart(2, "0"),
    },
    {
      key: "ROLEID",
      title: t("admin_mapping.role_name", "ROLE NAME"),
      dataIndex: "ROLEID",
      align: "left",
      render: (row) => (
        <div className={styles.userIdCell}>
          <span>{row.ROLEID}</span>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.splitLayout}>
        {/* LEFT PANE (Giữ nguyên) */}
        <div className={styles.leftPane}>
          <CustomSection
            title={<div className={styles.sectionTitle}><TbListDetails className={styles.sectionIcon} size={20} /><span>{t("admin_users.list")} {isLoading && "..."}</span></div>}
            badge={`${filteredRoles.length}`}
            extra={
              <div className={styles.headerToolbar}>
                <div className={styles.searchBox}>
                  <TbSearch className={styles.searchIcon} size={16} />
                  <input type="text" placeholder={t("admin_roles.search")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  {searchTerm && <TbX className={styles.clearSearch} onClick={() => setSearchTerm("")} />}
                </div>
              </div>
            }
            noPadding
          >
            <CustomTable columns={columns} data={filteredRoles} rowKey="ID" maxHeight="100%" onRowClick={handleSelectRole} activeRowId={selectedRole?.ID} enableSort enableResize />
          </CustomSection>
        </div>

        {/* RIGHT PANE: DỰA VÀO DỮ LIỆU ĐÃ MAP TỰ ĐỘNG */}
        <div className={styles.rightPane}>
          <div className={styles.rightPaneInner}>
            <CustomSection
              noPaddingSidesBottom={false}
              title={<div className={styles.sectionTitle}><TbUserEdit className={styles.sectionIcon} size={20} /><span>{t("admin_users.form_edit")}</span></div>}
              extra={<button onClick={handleClearForm} className={styles.clearFormBtn} title={t("admin_users.btn_clear")}><TbRefresh size={18} /></button>}
            >
              {!selectedRole ? (
                <div className={styles.emptyState}>
                  <TbUserEdit size={48} className={styles.emptyIcon} />
                  <p>{t("admin_mapping.info1")}</p>
                </div>
              ) : (
                <div className={styles.mappingWrapper}>
                  <div className={styles.topActionButtons}>
                    <button className={styles.textButton} onClick={() => setPerms({ ...savedPerms })} disabled={isSaving}>
                      <TbRestore size={16} />
                      {t("admin_mapping.btn_return") || "Hủy"}
                    </button>
                    <button className={styles.textButton} onClick={handleSave} disabled={isSaving}>
                      <TbDeviceFloppy size={16} />
                      {isSaving ? "Saving..." : t("admin_mapping.btn_save") || "Lưu cấu hình"}
                    </button>
                  </div>

                  <div className={styles.treeArea}>
                    {PERMISSION_GROUPS.map(function renderNode(node, level = 0) {
                      const hasSub = node.items && node.items.length > 0;
                      const state = getNodeState(node);
                      const isExpanded = expandedMenus[node.key];
                      const isLocked = !hasSub && isDisabledPermission(node.key);

                      // Đối với các node con cuối cùng (leaf)
                      if (!hasSub && level > 0) {
                        return (
                          <div
                            key={node.key}
                            className={`${styles.subItem} ${state === 2 ? styles.subActive : ""} ${isLocked ? styles.locked : ""}`}
                            onClick={(e) => handleToggleNode(e, node)}
                            title={isLocked ? t("admin_mapping.info2") : ""}
                          >
                            <div className={`${styles.checkbox} ${state === 2 ? styles.checked : ""}`}>
                              {state === 2 && <TbCheck size={12} />}
                            </div>
                            <span className={styles.subName}>{t(node.titleKey, node.titleFallback)}</span>
                          </div>
                        );
                      }

                      // Đối với các menu cha (có sub-menu) hoặc menu gốc
                      return (
                        <div key={node.key} className={styles.menuWrapper}>
                          <div
                            className={`${styles.menuItem} ${state > 0 ? styles.itemActive : ""}`}
                            onClick={() => {
                              if (hasSub) setExpandedMenus(prev => ({ ...prev, [node.key]: !prev[node.key] }));
                              else handleToggleNode(null, node);
                            }}
                          >
                            <div className={styles.itemLeft}>
                              <div
                                className={`${styles.checkbox} ${state === 2 ? styles.checked : ""}`}
                                onClick={(e) => handleToggleNode(e, node)}
                              >
                                {state === 2 && <TbCheck size={12} />}
                                {state === 1 && <div style={{ width: 8, height: 2, background: "white", borderRadius: 2 }}></div>}
                              </div>
                              <span className={styles.itemName}>{t(node.titleKey, node.titleFallback)}</span>
                            </div>
                            <div className={styles.itemRight}>
                              {hasSub && (isExpanded ? <TbChevronDown size={18} /> : <TbChevronRight size={18} />)}
                            </div>
                          </div>

                          {hasSub && isExpanded && (
                            <div className={styles.subContainer}>
                              {node.items.map(child => renderNode(child, level + 1))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CustomSection>
          </div>
        </div>
      </div>
      <CustomAlertModal {...alertModal} onClose={() => setAlertModal(a => ({ ...a, isOpen: false }))} />
    </div>
  );
}
