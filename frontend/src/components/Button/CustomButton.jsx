import { forwardRef } from "react";
import styles from "./CustomButton.module.css";

const CustomButton = forwardRef(({
  children,       // Thay 'content' bằng 'children'
  onClick,
  icon = null,
  type = "primary",
  htmlType = "button",
  disabled = false,
  className = "",
  ...rest         // Gom các props còn lại
}, ref) => {
  return (
    <button
      ref={ref}
      type={htmlType}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.btn} ${styles[type]} ${className}`}
      {...rest}       // Truyền phần còn lại vào thẻ button
    >
      {icon && <span className={styles.iconWrap}>{icon}</span>}
      {/* Hiển thị children */}
      <span>{children}</span>
    </button>
  );
});

// Định danh cho DevTools dễ debug khi dùng forwardRef
CustomButton.displayName = "CustomButton";

export default CustomButton;

//Cách dùng mới sẽ tự nhiên hơn: <CustomButton icon={<SaveIcon />}>Lưu Kho</CustomButton>