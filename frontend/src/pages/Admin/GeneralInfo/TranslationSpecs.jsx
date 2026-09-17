import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx-js-style";
import CustomSection from "../../../components/Section/CustomSection.jsx";
import CustomInput from "../../../components/Input/CustomInput.jsx";
import CustomButton from "../../../components/Button/CustomButton.jsx";
import CustomTable from "../../../components/Table/CustomTable.jsx";
import CustomAlertModal from "../../../components/Modal/CustomAlertModal.jsx";
import CustomLoading from "../../../components/Loading/CustomLoading.jsx";
import styles from "./TranslationSpecs.module.css";
import {
  TbListDetails,
  TbUserEdit,
  TbDeviceFloppy,
  TbSearch,
  TbX,
  TbRefresh,
  TbDownload,
  TbUpload,
} from "react-icons/tb";

import { exportToExcel } from "../../../utils/exportExcel.js";
import {
  getAllTranslations,
  updateTranslation,
  importTranslations,
} from "../../../api/admin/generalApi.js";
import { useTranslation } from "react-i18next";

const EMPTY_FORM = { ID: "", EN: "", VI: "", KR: "", DESCRIPTION: "" };

export default function TranslationSpecs() {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const showAlert = useCallback(
    (type, title, message) =>
      setAlertModal({ isOpen: true, type, title, message }),
    [],
  );

  const fetchData = useCallback(async () => {
    try {
      const response = await getAllTranslations();
      const { success, data: list } = response.data;
      if (success) setData(list);
    } catch {
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchTimer = setTimeout(fetchData, 0);
    return () => clearTimeout(fetchTimer);
  }, [fetchData]);

  const handleUpdate = async () => {
    if (!formData.ID) return;
    setIsSaving(true);
    try {
      await updateTranslation(formData.ID, {
        EN: formData.EN,
        VI: formData.VI,
        KR: formData.KR,
      });
      showAlert(
        "success",
        t("admin_users.success"),
        t("admin_translation.update_success"),
      );
      fetchData();
    } catch (err) {
      showAlert("error", t("admin_users.error"), err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── EXPORT LOGIC ───
  const handleExportExcel = () => {
    exportToExcel(filteredData, columns, "Language_Translations");
  };

  // ─── IMPORT LOGIC ───
  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsLoading(true);
    setProgress(10);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        setProgress(30);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws);
        setProgress(50);
        // Map dữ liệu theo tiêu đề cột của file Export
        const cleanData = jsonData
          .filter((item) => item["KEY ID"])
          .map((item) => ({
            ID: item["KEY ID"],
            EN: item["ENGLISH"] || "",
            KR: item["KOREAN"] || "",
            VI: item["VIETNAMESE"] || "",
          }));
        setProgress(70);
        if (cleanData.length === 0) {
          return showAlert(
            "error",
            t("admin_users.error"),
            t("admin_translation.import_error1"),
          );
        }

        setIsLoading(true);
        const res = await importTranslations(cleanData);
        setProgress(100);
        showAlert(
          "success",
          t("admin_users.success"),
          res.data.message || t("admin_translation.update_success"),
        );
        fetchData();
      } catch {
        showAlert(
          "error",
          t("admin_users.error"),
          t("admin_translation.import_error"),
        );
      } finally {
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 5000);
        e.target.value = null;
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredData =
    !searchTerm || !data
      ? data || []
      : data.filter((item) => {
        const lw = searchTerm.toLowerCase();
        const fields = [item.ID, item.DESCRIPTION, item.EN, item.KR, item.VI];
        return fields.some((val) =>
          val?.toString().toLowerCase().includes(lw),
        );
      });

  const columns = [
    {
      key: "ID",
      title: t("table.id", "ID"),
      dataIndex: "ID",
      align: "center",
      width: "60px",
      render: (row) => <span>{row.ID}</span>,
    },
    {
      key: "DESCRIPTION",
      title: t("admin_translation.description", "DESCRIPTION"),
      dataIndex: "DESCRIPTION",
      align: "left",
      width: "250px",
    },
    {
      key: "EN", title: t("admin_translation.en", "EN"), dataIndex: "EN",
      align: "left",
      width: "250px",
    },
    {
      key: "KR", title: t("admin_translation.kr", "KR"), dataIndex: "KR",
      align: "left",
      width: "250px",
    },
    {
      key: "VI", title: t("admin_translation.vi", "VI"), dataIndex: "VI",
      align: "left",
      width: "250px",
    },
  ];

  return (
    <div className={styles.page}>
      <CustomLoading
        show={isLoading}
        percentage={progress}
        message="Loading..."
      />
      <div className={styles.splitLayout}>
        {/* LEFT: TABLE AREA */}
        <div className={styles.leftPane}>
          <CustomSection
            title={
              <div className={styles.sectionTitle}>
                <TbListDetails className={styles.sectionIcon} size={20} />
                <span>
                  LIST {isLoading && "..."}
                </span>
              </div>
            }
            badge={`${filteredData.length}`}
            extra={
              <div className={styles.headerToolbar}>
                <div className={styles.searchBox}>
                  <TbSearch className={styles.searchIcon} size={16} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <TbX
                      className={styles.clearSearch}
                      onClick={() => setSearchTerm("")}
                    />
                  )}
                </div>

                <div className={styles.tableActions}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept=".xlsx, .xls"
                    onChange={handleImportExcel}
                  />

                  <button
                    className={styles.textButton}
                    onClick={() => fileInputRef.current.click()}

                  >
                    <TbUpload size={16} />
                    {t("admin_translation.btn_import")}
                  </button>

                  <button
                    className={styles.textButton}
                    onClick={handleExportExcel}

                  >
                    <TbDownload size={16} />
                    {t("admin_translation.btn_export")}
                  </button>
                </div>
              </div>
            }
          >

            <CustomTable
              columns={columns}
              data={filteredData}
              rowKey="ID"
              maxHeight="calc(100vh - 150px)"
              onRowClick={(item) => setFormData({ ...item })}
              activeRowId={formData.ID}
              enableResize={true}
            />
          </CustomSection>
        </div>

        {/* RIGHT: EDITOR AREA */}
        <div className={styles.rightPane}>
          <div className={styles.rightPaneInner}>
            <CustomSection noPaddingSidesBottom={false}
              title={
                <div className={styles.sectionTitle}>
                  <TbUserEdit className={styles.sectionIcon} size={20} />
                  <span>EDITOR</span>
                </div>
              }
              extra={
                <button
                  onClick={() => setFormData(EMPTY_FORM)}
                  className={styles.clearFormBtn}
                >
                  <TbRefresh size={18} />
                </button>
              }
            >
              <div className={styles.topActionButtons}>

                <button
                  className={styles.textButton}
                  onClick={handleUpdate}
                  disabled={isSaving || !formData.ID}
                >
                  <TbDeviceFloppy size={16} />
                  {isSaving
                    ? t("admin_users.saving")
                    : t("admin_users.btn_update")}
                </button>

              </div>

              <div className={styles.formContainer}>
                <CustomInput
                  label={t("table.id", "ID")}
                  value={formData.ID}
                  required
                  readOnly
                  disabled
                  labelWidth="100px"
                />
                <CustomInput
                  label={t("admin_translation.description", "Description")}
                  value={formData.DESCRIPTION}
                  required
                  readOnly
                  disabled
                  labelWidth="100px"
                />
                <hr className={styles.divider} />
                <CustomInput
                  label={t("admin_translation.en", "EN")}
                  value={formData.EN}
                  onChange={(e) =>
                    setFormData({ ...formData, EN: e.target.value })
                  }
                  labelWidth="100px"
                />
                <CustomInput
                  label={t("admin_translation.kr", "KR")}
                  value={formData.KR}
                  onChange={(e) =>
                    setFormData({ ...formData, KR: e.target.value })
                  }
                  labelWidth="100px"
                />
                <CustomInput
                  label={t("admin_translation.vi", "VI")}
                  value={formData.VI}
                  onChange={(e) =>
                    setFormData({ ...formData, VI: e.target.value })
                  }
                  labelWidth="100px"
                />
              </div>

            </CustomSection>
          </div>
        </div>
      </div>
      <CustomAlertModal
        {...alertModal}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
      />
    </div>
  );
}
