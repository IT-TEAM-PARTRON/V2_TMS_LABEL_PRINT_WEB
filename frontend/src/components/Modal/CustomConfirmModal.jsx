import styles from "./CustomConfirmModal.module.css";
import CustomButton from "../Button/CustomButton.jsx";
import { TbAlertTriangle, TbX, TbCheck } from "react-icons/tb";
import { useTranslation } from "react-i18next";

export default function CustomConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  isDanger = true, // Mặc định là nút đỏ (Xóa), nếu false sẽ là nút xanh (Đồng ý)
}) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const displayTitle = title || t("components.modal.confirm_title");
  const displayMessage = message || t("components.modal.confirm_message");
  const displayConfirmText =
    confirmText || t(isDanger ? "components.modal.delete" : "components.modal.confirm");
  const displayCancelText = cancelText || t("components.modal.cancel");

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <TbAlertTriangle
              size={24}
              className={isDanger ? styles.iconDanger : styles.iconWarning}
            />
            <h3>{displayTitle}</h3>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onCancel}
            aria-label={t("components.modal.close")}
          >
            <TbX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <p>{displayMessage}</p>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <CustomButton type="default" onClick={onCancel} style={{ textTransform: "none" }}>
            {displayCancelText}
          </CustomButton>
          <CustomButton
            type={isDanger ? "danger" : "primary"}
            onClick={onConfirm}
            style={{ textTransform: "none" }}
          >
            {displayConfirmText}
          </CustomButton>
        </div>
      </div>
    </div>
  );
}
