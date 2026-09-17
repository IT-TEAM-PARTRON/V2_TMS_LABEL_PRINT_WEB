import { useState } from "react";
import { useTranslation } from "react-i18next";
// 👇 THÊM TbEye, TbEyeOff vào đây
import { TbX, TbDeviceFloppy, TbLock, TbEye, TbEyeOff } from "react-icons/tb";
import CustomInput from "../Input/CustomInput.jsx";
import CustomButton from "../Button/CustomButton.jsx";
import styles from "./ChangePasswordModal.module.css";
import CustomAlertModal from "../../components/Modal/CustomAlertModal.jsx";
import { changeUserPassword } from "../../api/admin/generalApi.js";

export default function ChangePasswordModal({ isOpen, onClose, user }) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // 👇 THÊM 2 STATE ĐỂ QUẢN LÝ ẨN/HIỆN
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setFormData({ newPassword: "", confirmPassword: "" });
    setError("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const showAlert = (type, title, message) => {
    setAlertModal({ isOpen: true, type, title, message });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSave = async () => {
    // ... (Giữ nguyên logic handleSave của bạn)
    if (!formData.newPassword || !formData.confirmPassword) {
      setError(t("modal_change_password.error1"));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError(t("modal_change_password.error2"));
      return;
    }

    if (formData.newPassword.length < 4) {
      setError(t("modal_change_password.error3"));
      return;
    }

    try {
      setIsSaving(true);
      await changeUserPassword({
        userId: user.ID, // Đã đổi sang dùng khóa chính ID thay cho USERID
        newPassword: formData.newPassword,
      });
      showAlert(
        "success",
        t("general_title.success"),
        t("modal_change_password.success"),
      );
      setTimeout(handleClose, 1500); // Đóng modal sau khi hiện alert thành công
    } catch (err) {
      setError(
        err.response?.data?.message || t("modal_change_password.request_failed"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header - Giữ nguyên */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <TbLock size={20} className={styles.icon} />
            <h2>{t("header.change_password")}</h2>
          </div>
          <button
            className={styles.closeBtn}
            onClick={handleClose}
            disabled={isSaving}
          >
            <TbX size={20} />
          </button>
        </div>

        <div className={styles.body}>
          {/* Info Box - Giữ nguyên */}
          <div className={styles.infoBox}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>
                {t("components.user.user_name")}:
              </span>
              <span className={styles.infoValue}>{user?.FULLNAME || "—"}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>
                {t("components.user.role")}:
              </span>
              <span className={styles.infoValue}>{user?.ROLEID || "—"}</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            {/* 👇 Ô NHẬP MẬT KHẨU MỚI */}
            <div className={styles.passwordWrapper}>
              <CustomInput
                label={t("modal_change_password.new_password")}
                name="newPassword"
                type={showNewPassword ? "text" : "password"} // Thay đổi type dựa trên state
                required
                value={formData.newPassword}
                onChange={handleChange}
                labelWidth="150px"
                disabled={isSaving}
                style={{ textTransform: "none" }}
              />
              <button
                type="button"
                className={styles.passToggleBtn}
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <TbEyeOff size={18} /> : <TbEye size={18} />}
              </button>
            </div>

            {/* 👇 Ô XÁC NHẬN MẬT KHẨU */}
            <div className={styles.passwordWrapper}>
              <CustomInput
                label={t("modal_change_password.confirm_password")}
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"} // Thay đổi type dựa trên state
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                labelWidth="150px"
                disabled={isSaving}
                error={!!error}
                style={{ textTransform: "none" }}
              />
              <button
                type="button"
                className={styles.passToggleBtn}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <TbEyeOff size={18} />
                ) : (
                  <TbEye size={18} />
                )}
              </button>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}
          </div>
        </div>

        {/* Footer Buttons - Giữ nguyên */}
        <div className={styles.footer}>
          <CustomButton
            type="danger"
            onClick={handleClose}
            disabled={isSaving}
            style={{
              textTransform: "none"
            }}
          >
            {t("admin_users.cancel")}
          </CustomButton>
          <CustomButton
            type="primary"
            icon={<TbDeviceFloppy size={18} />}
            onClick={handleSave}
            disabled={isSaving}
            style={{ textTransform: "none" }}
          >
            {isSaving
              ? t("modal_change_password.saving")
              : t("modal_change_password.btn_confirm")}
          </CustomButton>
        </div>
      </div>
      <CustomAlertModal
        {...alertModal}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
      />
    </div>
  );
}
