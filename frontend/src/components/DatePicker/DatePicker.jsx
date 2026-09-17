import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { TbCalendar } from "react-icons/tb";
import styles from "./DatePicker.module.css";

export default function CustomDatePicker({
  label,
  required = false,
  labelWidth = "140px",
  width = "100%",
  disabled = false,
  ...datePickerProps
}) {
  return (
    <div
      className={styles.wrapper}
      style={{
        gridTemplateColumns: label ? `${labelWidth} 1fr` : "1fr",
        width,
      }}
    >
      {label && (
        <div className={styles.labelWrap}>
          {required && <span className={styles.required}>*</span>}
          <span className={styles.labelText}>{label}</span>
        </div>
      )}

      <div className={styles.dateFieldWrap}>
        <DatePicker
          {...datePickerProps}
          disabled={disabled}
          className={`${styles.dateInput} ${disabled ? styles.inputDisabled : ""}`}
          wrapperClassName={styles.dpWrapper}
        />
        <TbCalendar className={styles.calendarIcon} size={18} />
      </div>
    </div>
  );
}
