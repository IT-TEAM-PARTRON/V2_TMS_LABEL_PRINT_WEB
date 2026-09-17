import { useState, useRef, useEffect, forwardRef } from "react";
import { useTranslation } from "react-i18next";
import styles from "./CustomMultiSelect.module.css";

const CustomMultiSelect = forwardRef(
  (
    {
      label,
      required = false,
      value = [], // Array of selected values
      onChange,
      options = [],
      disabled = false,
      placeholder,
      width = "100%", 
      labelWidth = "140px", 
      ...rest
    },
    forwardedRef,
  ) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    // Get selected labels for display
    const selectedLabels = options
      .filter((o) => value.includes(o.value))
      .map((o) => o.label)
      .join(", ");

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

    const toggleOption = (optionValue) => {
      if (value.includes(optionValue)) {
        onChange(value.filter((v) => v !== optionValue));
      } else {
        onChange([...value, optionValue]);
      }
    };

    return (
      <div
        className={styles.wrapper}
        ref={containerRef}
        style={{
          gridTemplateColumns: label ? `${labelWidth} 1fr` : "1fr",
          width,
          position: "relative", 
          zIndex: open ? 9999 : 1, 
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
                selectedLabels.length > 0 ? styles.triggerTextSelected : styles.triggerText
              }
              title={selectedLabels} // Show full list on hover if truncated
            >
              {selectedLabels.length > 0
                ? selectedLabels
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
                options.map((o) => {
                  const isSelected = value.includes(o.value);
                  return (
                    <div
                      key={o.value}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent dropdown from closing
                        toggleOption(o.value);
                      }}
                      className={styles.option}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        readOnly 
                        className={styles.checkbox}
                      />
                      {o.label}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

CustomMultiSelect.displayName = "CustomMultiSelect";

export default CustomMultiSelect;
