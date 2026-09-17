import { useState, useRef, useEffect, forwardRef } from "react";
import { useTranslation } from "react-i18next";
import styles from "./CustomCombobox.module.css";

const CustomComboBox = forwardRef(
  (
    {
      label,
      required = false,
      value,
      onChange,
      options = [],
      disabled = false,
      width = "100%", // Đổi mặc định thành 100% để nó tự fill theo Grid
      labelWidth = "140px", // THÊM PROP NÀY (Giống hệt CustomInput)
      placeholder,
      ...rest
    },
    forwardedRef,
  ) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    const selected = options.find((o) => o.value === value);

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div
        className={styles.wrapper}
        ref={containerRef}
        /* SỬ DỤNG GRID TEMPLATE COLUMNS ĐỂ CHIA CỘT */
        style={{
          gridTemplateColumns: label ? `${labelWidth} 1fr` : "1fr",
          width,
          position: "relative", // Bắt buộc có relative thì z-index mới chạy
          zIndex: open ? 9999 : 1, // 👈 CHÌA KHÓA Ở ĐÂY: Mở thì nổi lên, đóng thì chìm xuống
        }}
      >
        {/* Label */}
        {label && (
          <div className={styles.labelWrap}>
            {required && <span className={styles.required}>*</span>}
            <span className={styles.labelText}>{label}</span>
          </div>
        )}

        {/* Combobox container */}
        <div className={styles.combobox}>
          {/* Trigger */}
          <div
            ref={forwardedRef}
            tabIndex={disabled ? -1 : 0}
            onClick={() => !disabled && setOpen((prev) => !prev)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!disabled) setOpen((prev) => !prev);
              }
            }}
            className={`${styles.trigger} ${open ? styles.triggerOpen : ""} ${disabled ? styles.triggerDisabled : ""}`}
            {...rest}
          >
            <span
              className={
                selected ? styles.triggerTextSelected : styles.triggerText
              }
            >
              {selected
                ? selected.label
                : placeholder || t("components.select.placeholder")}
            </span>
            <div className={styles.chevronWrap}>
              <span
                className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
              >
                ▼
              </span>
            </div>
          </div>

          {/* Dropdown */}
          {open && (
            <div className={styles.dropdown}>
              {options.length === 0 ? (
                <div className={styles.empty}>{t("components.select.no_data")}</div>
              ) : (
                options.map((o, idx) => (
                  <div
                    key={o.value}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={`${styles.option} ${idx !== options.length - 1 ? styles.optionBorder : ""} ${value === o.value ? styles.optionActive : ""}`}
                  >
                    {o.label}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

CustomComboBox.displayName = "CustomComboBox";

export default CustomComboBox;
