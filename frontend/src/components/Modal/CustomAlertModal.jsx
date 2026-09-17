import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import styles from "./CustomAlertModal.module.css";
import CustomButton from "../Button/CustomButton.jsx";
import {
  TbAlertTriangle,
  TbX,
  TbCheck,
  TbInfoCircle
} from "react-icons/tb";

export default function CustomAlertModal({
  isOpen,
  title,
  message,
  type = "success",
  onClose,
  buttonText,
}) {
  const { t } = useTranslation();

  // ─── LOGIC CHẶN SỰ KIỆN PHÍM CỨNG (ENTER/ESC) ───
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "Enter" || e.key === "Escape") {
        // 1. Chặn hành động mặc định
        e.preventDefault();

        // 2. Ngừng lan tỏa sự kiện để ô Input bên dưới không nhận được phím Enter này
        e.stopPropagation();
        e.stopImmediatePropagation();

        onClose();
      }
    };

    // QUAN TRỌNG: Thêm tham số 'true' để sử dụng Capture Phase (Bắt sự kiện từ trên xuống)
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderIcon = () => {
    switch (type) {
      case "error":
        return (
          <div className={`${styles.iconBox} ${styles.bgError}`}>
            <TbX size={32} className={styles.iconError} />
          </div>
        );
      case "warning":
        return (
          <div className={`${styles.iconBox} ${styles.bgWarning}`}>
            <TbAlertTriangle size={32} className={styles.iconWarning} />
          </div>
        );
      case "info":
        return (
          <div className={`${styles.iconBox} ${styles.bgInfo}`}>
            <TbInfoCircle size={32} className={styles.iconInfo} />
          </div>
        );
      default:
        return (
          <div className={`${styles.iconBox} ${styles.bgSuccess}`}>
            <TbCheck size={32} className={styles.iconSuccess} strokeWidth={3} />
          </div>
        );
    }
  };

  const getButtonType = () => {
    if (type === "error") return "danger";
    return "primary";
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeBtnCorner}
          onClick={onClose}
          aria-label={t("components.modal.close")}
        >
          <TbX size={20} />
        </button>

        <div className={styles.body}>
          {renderIcon()}
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.message}>{message}</p>
        </div>

        <div className={styles.footer}>
          <CustomButton
            type={getButtonType()}
            onClick={onClose}
            className={styles.centerBtn}
            autoFocus
          >
            {buttonText || t("components.modal.close")}
          </CustomButton>
        </div>
      </div>
    </div>
  );
}
