import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaCheck } from "react-icons/fa";
import styles from "./LanguageSwitcher.module.css";
import { LANGUAGES } from "./language.js";

export default function LanguageSwitcher({ theme = "light" }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const languages = LANGUAGES;

  const current =
    languages.find((l) => l.code === i18n.language) || languages[0];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setOpen(false);
  };

  // click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div
      className={`${styles.container} ${theme === "dark" ? styles.dark : ""}`}
      ref={ref}
    >
      {/* BUTTON */}
      <div
        className={styles.selected}
        onClick={() => setOpen(!open)}
        title={t("components.language.select_language")}
      >
        <span>{current.code.toUpperCase()}</span>
        <span className={`${styles.arrow} ${open ? styles.rotate : ""}`}>
          ▼
        </span>
      </div>

      {/* DROPDOWN */}
      <div className={`${styles.dropdown} ${open ? styles.show : ""}`}>
        {languages.map((lang) => (
          <div
            key={lang.code}
            className={`${styles.item} ${
              lang.code === current.code ? styles.active : ""
            }`}
            onClick={() => changeLanguage(lang.code)}
          >

            {/* 👉 LABEL */}
            <span className={styles.label}>{t(lang.labelKey)}</span>

            {lang.code === current.code && <FaCheck className={styles.check} />}
          </div>
        ))}
      </div>
    </div>
  );
}
