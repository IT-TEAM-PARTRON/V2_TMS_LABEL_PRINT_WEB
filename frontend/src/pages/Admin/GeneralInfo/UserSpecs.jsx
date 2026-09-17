import { useState, useEffect, useMemo, useCallback } from "react";
import CustomSection from "../../../components/Section/CustomSection.jsx";
import CustomInput from "../../../components/Input/CustomInput.jsx";
import CustomButton from "../../../components/Button/CustomButton.jsx";
import CustomTable from "../../../components/Table/CustomTable.jsx";
import CustomComboBox from "../../../components/Combobox/CustomCombobox.jsx";
import CustomConfirmModal from "../../../components/Modal/CustomConfirmModal.jsx";
import CustomAlertModal from "../../../components/Modal/CustomAlertModal.jsx";
import styles from "./UserSpecs.module.css";
import {
  TbListDetails,
  TbUserEdit,
  TbTrash,
  TbDeviceFloppy,
  TbFilePlus,
  TbX,
  TbSearch,
  TbEye,
  TbEyeOff,
  TbRefresh,
} from "react-icons/tb";

import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
} from "../../../api/admin/generalApi.js";
import { useTranslation } from "react-i18next";

const EMPTY_FORM = {
  ID: null,
  USERID: "",
  FULLNAME: "",
  PASSWORD: "",
  ROLEID: "",
  STATUS: "Active",
  FACTORYID: null,
  DEPARTMENTID: null,
};

export default function UserSpecs() {
  const { t } = useTranslation();

  const [users, setUsers] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    idToDelete: null,
  });

  const statusOptions = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

  const showAlert = useCallback((type, title, message) => {
    setAlertModal({ isOpen: true, type, title, message });
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await getRoles();
      const { success, data } = response.data;
      if (success && Array.isArray(data)) {
        const formattedRoles = data.map((item) => ({
          value: item.ROLEID,
          label: item.ROLEID,
        }));
        setRoleOptions(formattedRoles);
      }
    } catch (error) {
      console.error("Fetch Roles Error:", error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await getAllUsers();
      const { success, data, message } = response.data;
      if (!success) throw new Error(message);
      const usersArray = Array.isArray(data) ? data : [];
      setUsers(usersArray);
    } catch (error) {
      showAlert(
        "error",
        t("message.title_fetch_error"),
        t("message.message_fetch_error") +
        (error.response?.data?.message || error.message),
      );
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [showAlert, t]);

  useEffect(() => {
    const fetchTimer = setTimeout(() => {
      fetchUsers();
      fetchRoles();
    }, 0);
    return () => clearTimeout(fetchTimer);
  }, [fetchRoles, fetchUsers]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowerTerm = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        (u.USERID && u.USERID.toLowerCase().includes(lowerTerm)) ||
        (u.FULLNAME && u.FULLNAME.toLowerCase().includes(lowerTerm)),
    );
  }, [users, searchTerm]);

  const handleClearForm = () => {
    setFormData(EMPTY_FORM);
    setShowPassword(false);
  };

  const handleSelectUser = (user) => {
    setFormData({ ...user, PASSWORD: user.PASSWORD || "" });
    setShowPassword(false);
  };

  // ─── ACTION: CREATE ───
  const handleActionCreate = async () => {
    if (
      !formData.USERID ||
      !formData.FULLNAME ||
      !formData.ROLEID ||
      !formData.PASSWORD
    ) {
      showAlert(
        "error",
        t("admin_users.error"),
        t("admin_users.create_error2"),
      );
      return;
    }

    const isDuplicate = users.some(
      (u) => u.USERID.toLowerCase() === formData.USERID.trim().toLowerCase(),
    );
    if (isDuplicate) {
      showAlert(
        "error",
        t("admin_users.error"),
        t("admin_users.create_error1"),
      );
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        USERID: formData.USERID.trim(),
        FULLNAME: formData.FULLNAME.trim(),
      };
      delete payload.ID;

      const create = await createUser(payload);
      showAlert("success", t("admin_users.success"), create.data.message);
      handleClearForm();
      await fetchUsers();
    } catch (error) {
      showAlert(
        "error",
        t("admin_users.error"),
        error.response?.data?.message || error.message,
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ─── ACTION: UPDATE ───
  const handleActionUpdate = async () => {
    if (!formData.USERID || !formData.FULLNAME || !formData.ROLEID) {
      showAlert(
        "error",
        t("admin_users.error"),
        t("admin_users.create_error2"),
      );
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        USERID: formData.USERID.trim(),
        FULLNAME: formData.FULLNAME.trim(),
      };
      // Dùng trực tiếp khóa chính ID để update (đã đổi API sang nhận ID là khóa chính)
      const update = await updateUser(formData.ID, payload);
      showAlert("success", t("admin_users.success"), update.data.message);
      handleClearForm();
      await fetchUsers();
    } catch (error) {
      showAlert(
        "error",
        t("admin_users.error"),
        error.response?.data?.message || error.message,
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ─── ACTION: DELETE ───
  const handleDeleteClick = (id) => {
    setConfirmModal({ isOpen: true, idToDelete: id });
  };

  const executeDelete = async () => {
    const id = confirmModal.idToDelete;
    if (!id) return;
    try {
      const deleteid = await deleteUser(id);
      showAlert("success", t("admin_users.success"), deleteid.data.message);

      if (formData.ID === id) {
        handleClearForm();
      }
      await fetchUsers();
    } catch (error) {
      showAlert(
        "error",
        t("admin_users.error"),
        error.response?.data?.message || error.message,
      );
    } finally {
      setConfirmModal({ isOpen: false, idToDelete: null });
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
      key: "USERID",
      title: t("admin_users.userid", "USERID"),
      dataIndex: "USERID",
      width: "200px",
      render: (row) => (
        <div className={styles.userIdCell}>
          <div className={styles.avatarSmall}>
            {(row.FULLNAME || "U").charAt(0).toUpperCase()}
          </div>
          <span className={styles.highlightText}>{row.USERID}</span>
        </div>
      ),
    },
    {
      key: "FULLNAME",
      title: t("admin_users.fullname", "FULLNAME"),
      dataIndex: "FULLNAME",
      width: "150px",
      align: "left",
    },
    {
      key: "ROLEID",
      title: t("admin_users.roleid", "ROLEID"),
      align: "center",
      width: "100px",
      render: (row) => (
        <span
          className={`${styles.roleTag} ${row.ROLEID === "MANAGER" ? styles.roleManager : row.ROLEID === "ADMIN" ? styles.roleAdmin : styles.roleStaff}`}
        >
          {row.ROLEID}
        </span>
      ),
    },
    {
      key: "STATUS",
      title: t("admin_users.status", "STATUS"),
      align: "center",
      width: "100px",
      render: (row) => (
        <span
          className={`${styles.statusTag} ${row.STATUS === "Active" ? styles.statusActive : styles.statusInactive}`}
        >
          {row.STATUS}
        </span>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.splitLayout}>
        {/* ── BÊN TRÁI: DANH SÁCH NGƯỜI DÙNG ── */}
        <div className={styles.leftPane}>
          <CustomSection
            title={
              <div className={styles.sectionTitle}>
                <TbListDetails className={styles.sectionIcon} size={20} />
                <span>
                  LIST {isLoading && "..."}
                </span>
              </div>
            }
            badge={`${filteredUsers.length}`}
            extra={
              <div className={styles.headerToolbar}>
                <div className={styles.searchBox}>
                  <TbSearch className={styles.searchIcon} size={16} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <TbX
                      className={styles.clearSearch}
                      onClick={() => setSearchTerm("")}
                    />
                  )}
                </div>
              </div>
            }
          >
            <CustomTable
              columns={columns}
              data={filteredUsers}
              tableWidth="max-content"
              rowKey="ID"
              maxHeight="calc(100vh - 150px)"
              onRowClick={(row) => handleSelectUser(row)}
              activeRowId={formData.ID}
            />
          </CustomSection>
        </div>

        {/* ── BÊN PHẢI: FORM ĐIỀN THÔNG TIN ── */}
        <div className={styles.rightPane}>
          <div className={styles.rightPaneInner}>
            <CustomSection
              noPaddingSidesBottom={false}
              title={
                <div className={styles.sectionTitle}>
                  <TbUserEdit className={styles.sectionIcon} size={20} />
                  <span>EDITOR</span>
                </div>
              }
              extra={
                <button
                  onClick={handleClearForm}
                  className={styles.clearFormBtn}
                  title={t("admin_users.btn_clear")}
                >
                  <TbRefresh size={18} />
                </button>
              }
            >
              <div className={styles.topActionButtons}>

                <button
                  className={styles.textButton}
                  onClick={handleActionCreate}
                  disabled={isSaving}
                >
                  <TbFilePlus size={16} />
                  {isSaving
                    ? t("admin_users.saving")
                    : t("admin_users.btn_create")}
                </button>


                <button
                  className={styles.textButton}
                  onClick={handleActionUpdate}
                  disabled={isSaving || !formData.ID}
                >
                  <TbDeviceFloppy size={16} />
                  {isSaving
                    ? t("admin_users.saving")
                    : t("admin_users.btn_update")}
                </button>


                <button
                  className={styles.textButton}
                  onClick={() => handleDeleteClick(formData.ID)}
                  disabled={isSaving || !formData.ID}
                >
                  <TbTrash size={16} />
                  {t("admin_users.btn_delete")}
                </button>

              </div>

              <div className={styles.formContainer}>
                <CustomInput
                  label={t("admin_users.userid", "User ID")}
                  required
                  value={formData.USERID}
                  onChange={(e) =>
                    setFormData({ ...formData, USERID: e.target.value })
                  }
                  labelWidth="120px"
                />

                <CustomInput
                  label={t("admin_users.fullname", "Full Name")}
                  required
                  value={formData.FULLNAME}
                  onChange={(e) =>
                    setFormData({ ...formData, FULLNAME: e.target.value })
                  }
                  labelWidth="120px"
                />

                <div className={styles.passwordWrapper}>
                  <CustomInput
                    label={t("admin_users.password", "Password")}
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.PASSWORD}
                    onChange={(e) =>
                      setFormData({ ...formData, PASSWORD: e.target.value })
                    }
                    labelWidth="120px"
                  />
                  <button
                    type="button"
                    className={styles.passToggleBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    title={
                      showPassword
                        ? t("admin_users.hide_password")
                        : t("admin_users.unhide_password")
                    }
                  >
                    {showPassword ? (
                      <TbEyeOff size={18} />
                    ) : (
                      <TbEye size={18} />
                    )}
                  </button>
                </div>

                <CustomComboBox
                  label={t("admin_users.roleid", "Role ID")}
                  required
                  options={roleOptions}
                  value={formData.ROLEID}
                  onChange={(val) => setFormData({ ...formData, ROLEID: val })}
                  labelWidth="120px"
                />

                {/* <CustomComboBox
                  label={t("admin_users.factoryid", "Factory ID")}
                  required
                  options={factoryOptions}
                  value={formData.FACTORYID}
                  onChange={(val) =>
                    setFormData({
                      ...formData,
                      FACTORYID: val,
                      DEPARTMENTID: "",
                    })
                  }
                  labelWidth="120px"
                />

                <CustomComboBox
                  label={t("admin_users.departmentid", "Department ID")}
                  required
                  options={departmentOptions}
                  value={formData.DEPARTMENTID}
                  onChange={(val) =>
                    setFormData({ ...formData, DEPARTMENTID: val })
                  }
                  labelWidth="120px"
                /> */}

                <CustomComboBox
                  label={t("admin_users.status", "Status")}
                  options={statusOptions}
                  value={formData.STATUS}
                  onChange={(val) => setFormData({ ...formData, STATUS: val })}
                  labelWidth="120px"
                />
              </div>

              {/* ── Khu vực các nút bấm (Create, Update, Delete) ── */}
            </CustomSection>
          </div>
        </div>
      </div>

      <CustomAlertModal
        {...alertModal}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
      />

      <CustomConfirmModal
        {...confirmModal}
        title={t("admin_users.confirm_delete")}
        message={`${t("admin_users.content1")} "${confirmModal.idToDelete}" ${t("admin_users.content2")}`}
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, idToDelete: null })}
        confirmText={t("admin_users.confirm")}
        cancelText={t("admin_users.cancel")}
        isDanger={true}
      />
    </div>
  );
}
