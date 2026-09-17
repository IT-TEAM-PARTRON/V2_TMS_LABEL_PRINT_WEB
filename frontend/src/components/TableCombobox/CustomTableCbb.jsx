import { useState, useRef, useEffect, forwardRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styles from "./CustomTableCbb.module.css";
import { TbChevronDown, TbX } from "react-icons/tb";

const CustomTableCbb = forwardRef(
  (
    {
      label,
      required = false,
      value,
      onChange,
      options = [], // Mảng data: [{id: 1, name: 'A', code: 'X'}, ...]
      columns = [], // Cấu hình: [{header: 'Mã', key: 'code', width: '100px'}, ...]
      valueKey = "id", // Key để lấy giá trị lưu vào state
      labelKey = "name", // Key để hiển thị tên lên ô chọn
      disabled = false,
      width = "100%",
      labelWidth = "120px",
      dropdownWidth = "400px", // Độ rộng của bảng khi mở ra
      maxHeight = "223px", // Chiều cao tối đa của bảng
      placeholder,
      ...rest
    },
    forwardedRef,
  ) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const setInputRef = (node) => {
      inputRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    // Tìm đối tượng đang chọn
    const selected = useMemo(
      () => options.find((o) => String(o[valueKey]) === String(value)),
      [options, value, valueKey],
    );

    // Logic lọc dữ liệu
    const filteredOptions = useMemo(() => {
      const search = searchTerm.toLowerCase();
      return options.filter((opt) =>
        columns.some((col) =>
          String(opt[col.key] || "")
            .toLowerCase()
            .includes(search),
        ),
      );
    }, [options, searchTerm, columns]);

    // Đóng khi click ngoài
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setOpen(false);
          setSearchTerm(""); // Reset text tìm kiếm khi đóng
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = () => {
      if (disabled) return;
      setOpen(!open);
      if (!open) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };

    const handleSelect = (opt) => {
      onChange(opt[valueKey]);
      setOpen(false);
      setSearchTerm("");
    };

    return (
      <div
        className={styles.wrapper}
        ref={containerRef}
        style={{
          gridTemplateColumns: label ? `${labelWidth} 1fr` : "1fr",
          width,
          zIndex: open ? 9999 : 1,
        }}
      >
        {label && (
          <div className={styles.labelWrap}>
            {required && <span className={styles.required}>*</span>}
            <span className={styles.labelText}>{label}</span>
          </div>
        )}

        <div className={styles.combobox}>
          <div
            className={`
              ${styles.trigger}
              ${open ? styles.triggerOpen : ""}
              ${disabled ? styles.triggerDisabled : ""}
            `}
            onClick={handleToggle}
          >

            {/* Ô INPUT TÌM KIẾM TÍCH HỢP */}
            <input
              ref={setInputRef}
              type="text"
              className={styles.mainInput}
              placeholder={
                selected
                  ? selected[labelKey]
                  : placeholder || t("components.select.placeholder")
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!open) setOpen(true);
              }}
              disabled={disabled}
              readOnly={!open && !!selected} // Chỉ cho gõ khi đang mở hoặc chưa chọn gì
              {...rest}
            />

            <div className={styles.rightIcons}>
              {searchTerm && (
                <TbX
                  className={styles.clearBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                  }}
                />
              )}
              <div className={styles.chevronWrap}>
                <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}>
                  ▼
                </span>
              </div>
            </div>
          </div>

          {/* Table Dropdown */}
          {open && (
            <div className={styles.dropdown} style={{ width: dropdownWidth }}>
              <div className={styles.tableContent} style={{ maxHeight }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th key={col.key} style={{ width: col.width }}>
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOptions.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className={styles.empty}>
                          {t("components.select.no_data_found")}
                        </td>
                      </tr>
                    ) : (
                      filteredOptions.map((opt, idx) => (
                        <tr
                          key={opt[valueKey] || idx}
                          className={`${styles.row} ${String(value) === String(opt[valueKey]) ? styles.rowActive : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(opt);
                          }}
                        >
                          {columns.map((col) => (
                            <td key={col.key}>{opt[col.key] || "—"}</td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

CustomTableCbb.displayName = "CustomTableCbb";
export default CustomTableCbb;
