import { useTranslation } from "react-i18next";
import styles from "./CustomLoading.module.css";

const CustomLoading = ({ show = false, message, percentage }) => {
  const { t } = useTranslation();
  if (!show) return null;

  const displayMessage =
    message === undefined ? t("components.loading.processing") : message;
  const hasPercentage = Number.isFinite(percentage);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = hasPercentage
    ? circumference - (percentage / 100) * circumference
    : circumference * 0.75;

  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.container}>
        <div className={styles.progressBox}>
          <svg
            className={`${styles.svg} ${!hasPercentage ? styles.indeterminateSvg : ""}`}
            width="120"
            height="120"
            aria-hidden="true"
          >
            <circle
              className={styles.circleBg}
              cx="60"
              cy="60"
              r={radius}
              strokeWidth="10"
            />
            <circle
              className={styles.circleProgress}
              cx="60"
              cy="60"
              r={radius}
              strokeWidth="10"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: offset,
              }}
            />
          </svg>
          {hasPercentage && (
            <div className={styles.percentageText}>{Math.round(percentage)}%</div>
          )}
        </div>
        {displayMessage && <p className={styles.text}>{displayMessage}</p>}
      </div>
    </div>
  );
};

export default CustomLoading;
