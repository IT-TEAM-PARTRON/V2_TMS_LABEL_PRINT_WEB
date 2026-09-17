import { useState } from "react";
import styles from "./CustomSection.module.css";

export default function CustomSection({
  title,
  badge,
  extra,               // Prop mới: Chứa các nút thao tác góc phải
  collapsible = false, // Prop mới: Cho phép thu gọn section
  defaultExpanded = true,
  className = "",      // Prop mới: Cho phép ghi đè CSS từ component cha
  style,
  noPadding = false,   // Bỏ toàn bộ khoảng trống padding
  noPaddingSidesBottom = true, // MẶC ĐỊNH BỎ KHOẢNG TRỐNG TRÁI/PHẢI/DƯỚI
  children
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section className={`${styles.section} ${className}`} style={style}>
      {/* Header */}
      <div
        className={`${styles.header} ${collapsible ? styles.headerClickable : ""}`}
        onClick={() => collapsible && setExpanded(!expanded)}
      >
        <div className={styles.headerLeft}>
          {collapsible && (
            <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ""}`}>
              ▼
            </span>
          )}
          <h2 className={styles.title}>{title}</h2>
          {badge && <span className={styles.badge}>{badge}</span>}
        </div>

        {/* Extra Actions: Dùng stopPropagation để click nút không bị thu gọn section */}
        {extra && (
          <div className={styles.extra} onClick={(e) => e.stopPropagation()}>
            {extra}
          </div>
        )}
      </div>

      {/* Content */}
      {expanded && (
        <div className={`${styles.content} ${noPadding ? styles.noPadding : ""} ${noPaddingSidesBottom ? styles.noPaddingSidesBottom : ""}`}>
          {children}
        </div>
      )}
    </section>
  );
}