import { forwardRef } from "react";
import styles from "./CustomInput.module.css";

const CustomInput = forwardRef(({
  label,
  required = false,
  error, // Truyền error = true/false để ô input viền đỏ, không in text nữa
  className = "",
  labelClassName = "",
  width = "100%",
  labelWidth = "140px",
  ...inputProps
}, ref) => {
  return (
    <div
      className={styles.wrapper}
      style={{ gridTemplateColumns: label ? `${labelWidth} 1fr` : "1fr", width }}
    >
      {/* Label */}
      {label && (
        <div className={styles.labelWrap}>
          {required && <span className={styles.required}>*</span>}
          <span className={`${styles.labelText} ${labelClassName}`}>{label}</span>
        </div>
      )}

      {/* Input / Textarea */}
      <div className={styles.inputWrap}>
        {inputProps.type === "textarea" ? (
          <textarea
            ref={ref}
            {...inputProps}
            className={`
              ${styles.input}
              ${error ? styles.inputError : ""}
              ${className}
            `}
            style={{ resize: "vertical", minHeight: "80px", fontFamily: "inherit" }}
          />
        ) : (
          <input
            ref={ref}
            {...inputProps}
            className={`
              ${styles.input}
              ${error ? styles.inputError : ""}
              ${className}
            `}
          />
        )}
      </div>
    </div>
  );
});

CustomInput.displayName = "CustomInput";

export default CustomInput;