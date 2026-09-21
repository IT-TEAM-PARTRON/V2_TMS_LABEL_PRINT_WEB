import { useCallback, useEffect, useMemo, useState } from "react";
import CustomSection from "../../../components/Section/CustomSection.jsx";
import CustomInput from "../../../components/Input/CustomInput.jsx";
import CustomTable from "../../../components/Table/CustomTable.jsx";
import CustomAlertModal from "../../../components/Modal/CustomAlertModal.jsx";
import styles from "./ZplSpecs.module.css";
import {
  TbListDetails,
  TbUserEdit,
  TbDeviceFloppy,
  TbX,
  TbSearch,
  TbRefresh,
  TbPhoto,
  TbLayoutSidebarRightExpand,
} from "react-icons/tb";

import {
  getAllZplSpecs,
  updateZplSpec,
} from "../../../api/admin/standardApi.js";
import { useTranslation } from "react-i18next";

const EMPTY_FORM = {
  ID: null,
  ZPLTYPE: "",
  ZPLDENSITY: "",
  ZPLCODE: "",
};

export default function ZplSpecs() {
  const { t } = useTranslation();

  const [zplSpecs, setZplSpecs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const showAlert = useCallback((type, title, message) => {
    setAlertModal({ isOpen: true, type, title, message });
  }, []);

  const fetchZplSpecs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getAllZplSpecs();
      const { success, data, message } = response.data;
      if (!success) throw new Error(message);
      setZplSpecs(Array.isArray(data) ? data : []);
    } catch (error) {
      showAlert(
        "error",
        t("admin_users.error"),
        error.response?.data?.message || error.message,
      );
      setZplSpecs([]);
    } finally {
      setIsLoading(false);
    }
  }, [showAlert, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchZplSpecs(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchZplSpecs, t]);

  const filteredZpls = useMemo(() => {
    if (!searchTerm) return zplSpecs;
    const lowerTerm = searchTerm.toLowerCase();
    return zplSpecs.filter(
      (z) => z.ZPLTYPE && z.ZPLTYPE.toLowerCase().includes(lowerTerm),
    );
  }, [zplSpecs, searchTerm]);

  const handleClearForm = () => {
    setFormData(EMPTY_FORM);
    setShowPreview(false);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
  };

  const handleSelectZpl = (zpl) => {
    setFormData({ ...zpl });
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
  };

  // Khổ tem thật theo từng ZPLTYPE — lấy đúng số đã dùng ở các trang in thật
  // (SDCInner/GoodixInner/SDCOutbox/GoodixOutbox) để preview khớp 1:1 lúc in.
  const LABEL_SIZE_BY_TYPE = {
    TRAY: { dpmm: 24, width: 2.3622, height: 0.7874 },
    TRAY_TEST: { dpmm: 24, width: 2.3622, height: 0.7874 },
    SDC_INNER: {
      dpmm: 12,
      width: 2.6771667999999997,
      height: 1.5748039999999999,
    },
    SDC_INNER_TEST: {
      dpmm: 12,
      width: 2.6771667999999997,
      height: 1.5748039999999999,
    },
    SDC_OUTBOX: {
      dpmm: 12,
      width: 2.6771667999999997,
      height: 1.5748039999999999,
    },
    SDC_OUTBOX_TEST: {
      dpmm: 12,
      width: 2.6771667999999997,
      height: 1.5748039999999999,
    },
    GOODIX_INNER: { dpmm: 12, width: 2.7559069999999997, height: 3.93701 },
    GOODIX_INNER_TEST: { dpmm: 12, width: 2.7559069999999997, height: 3.93701 },
    GOODIX_OUTBOX: { dpmm: 12, width: 2.7559069999999997, height: 3.93701 },
    GOODIX_OUTBOX_TEST: { dpmm: 12, width: 2.7559069999999997, height: 3.93701 },
  };
  const DEFAULT_LABEL_SIZE = { dpmm: 12, width: 4, height: 6 };

  // Redraw preview từ ZPL Code hiện tại trong ô edit (kể cả khi chưa Update/lưu)
  // Dùng POST (body) thay vì nhét ZPL vào URL (GET) — ảnh ^GFA lớn làm URL vượt
  // giới hạn độ dài (Labelary trả lỗi "URI too long"), khiến <img> báo lỗi load.
  const handlePreview = async () => {
    if (!formData.ZPLCODE) return;
    setShowPreview(true);
    setPreviewError(false);
    setIsPreviewLoading(true);
    const { dpmm, width, height } =
      LABEL_SIZE_BY_TYPE[formData.ZPLTYPE] || DEFAULT_LABEL_SIZE;
    const url = `http://api.labelary.com/v1/printers/${dpmm}dpmm/labels/${width}x${height}/0/`;

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "image/png",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.ZPLCODE,
      });
      if (!response.ok) throw new Error(`Labelary error ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPreviewUrl(objectUrl);
      setIsPreviewLoading(false);
    } catch {
      setIsPreviewLoading(false);
      setPreviewError(true);
    }
  };

  const handleActionUpdate = async () => {
    if (!formData.ZPLCODE) {
      showAlert(
        "error",
        t("admin_users.error"),
        t("admin_zpl.code_required", "ZPL CODE is required"),
      );
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        ZPLCODE: formData.ZPLCODE, // Giữ nguyên khoảng trắng và format của ZPL
      };
      const response = await updateZplSpec(formData.ID, payload);
      showAlert("success", t("admin_users.success"), response.data.message);
      await fetchZplSpecs();
    } catch (error) {
      showAlert(
        "error",
        t("admin_users.error"),
        error.response?.data?.message || error.message,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    {
      key: "no",
      title: t("table.no", "NO"),
      align: "center",
      width: "5%",
      render: (_, idx) => String(idx + 1).padStart(2, "0"),
    },
    {
      key: "ZPLTYPE",
      title: t("admin_zpl.zpltype", "ZPL TYPE"),
      align: "left",
      width: "10%",
      render: (row) => (
        <span className={styles.highlightText}>{row.ZPLTYPE}</span>
      ),
    },
    {
      key: "ZPLDENSITY",
      title: t("admin_zpl.zpldensity", "ZPL DENSITY"),
      align: "left",
      width: "10%",
      render: (row) => <span>{row.ZPLDENSITY}</span>,
    },
    {
      key: "ZPLCODE",
      title: t("admin_zpl.zplcode", "ZPL CODE"),
      align: "left",
      width: "75%",
      render: (row) => <span>{row.ZPLCODE}</span>,
    },
  ];

  return (
    <div className={styles.page}>
      <div
        className={`${styles.splitLayout} ${showPreview ? styles.previewOpen : ""}`}
      >
        {/* ── BÊN TRÁI: DANH SÁCH ── */}
        <div className={styles.leftPane}>
          <CustomSection
            title={
              <div className={styles.sectionTitle}>
                <TbListDetails className={styles.sectionIcon} size={20} />
                <span>
                  {t("admin_users.list")} {isLoading && "..."}
                </span>
              </div>
            }
            badge={`${filteredZpls.length}`}
            extra={
              <div className={styles.headerToolbar}>
                <div className={styles.searchBox}>
                  <TbSearch className={styles.searchIcon} size={16} />
                  <input
                    type="text"
                    value={searchTerm}
                    placeholder={t("admin_zpl.search", "Search ZPL...")}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <TbX
                      className={styles.clearSearch}
                      onClick={() => setSearchTerm("")}
                    />
                  )}
                </div>
              </div>
            }
          >
            <CustomTable
              columns={columns}
              data={filteredZpls}
              rowKey="ID"
              maxHeight="calc(100vh - 150px)"
              onRowClick={(row) => handleSelectZpl(row)}
              activeRowId={formData.ID}
              enableResize={true}
              tableWidth="100%"
            />
          </CustomSection>
        </div>

        {/* ── BÊN PHẢI: FORM ── */}
        <div className={styles.rightPane}>
          <div className={styles.rightPaneInner}>
            <CustomSection
              noPaddingSidesBottom={false}
              title={
                <div className={styles.sectionTitle}>
                  <TbUserEdit className={styles.sectionIcon} size={20} />
                  <span>{t("admin_users.form_edit")}</span>
                </div>
              }
              extra={
                <button
                  onClick={handleClearForm}
                  className={styles.clearFormBtn}
                  title={t("admin_users.btn_clear")}
                >
                  <TbRefresh size={18} />
                </button>
              }
            >
              <div className={styles.topActionButtons}>
                <button
                  className={styles.textButton}
                  onClick={handleActionUpdate}
                  disabled={isSaving || !formData.ID}
                >
                  <TbDeviceFloppy size={16} />
                  {isSaving
                    ? t("admin_users.saving")
                    : t("admin_users.btn_update")}
                </button>
                <button
                  className={styles.textButton}
                  onClick={handlePreview}
                  disabled={!formData.ZPLCODE}
                >
                  <TbPhoto size={16} />
                  {t("admin_zpl.preview", "Preview")}
                </button>
              </div>

              <div className={styles.formContainer}>
                <CustomInput
                  label={t("admin_zpl.zpltype", "ZPL Type")}
                  required
                  value={formData.ZPLTYPE}
                  disabled={true} // Không cho phép sửa ZPL TYPE
                  labelWidth="120px"
                />
                <CustomInput
                  label={t("admin_zpl.zpldensity", "ZPL Density")}
                  value={formData.ZPLDENSITY}
                  disabled={true}
                  labelWidth="120px"
                />

                {/* Sử dụng TextArea cho ZPL Code */}
                <div className={styles.textareaContainer}>
                  <label className={styles.textareaLabel}>
                    <span className={styles.required}>*</span>
                    {t("admin_zpl.zplcode", "ZPL Code")}
                  </label>
                  <textarea
                    className={styles.zplTextarea}
                    value={formData.ZPLCODE || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, ZPLCODE: e.target.value })
                    }
                    disabled={!formData.ID} // Vô hiệu hóa nếu chưa chọn
                  />
                </div>
              </div>
            </CustomSection>
          </div>
        </div>

        {/* ── PREVIEW: REDRAW TEM TỪ ZPL CODE ── */}
        <div className={styles.previewPane}>
          <div className={styles.previewPaneInner}>
            <CustomSection
              noPaddingSidesBottom={false}
              title={
                <div className={styles.sectionTitle}>
                  <TbLayoutSidebarRightExpand
                    className={styles.sectionIcon}
                    size={20}
                  />
                  <span>{t("admin_zpl.preview_title", "Preview")}</span>
                </div>
              }
              extra={
                <button
                  onClick={() => setShowPreview(false)}
                  className={styles.clearFormBtn}
                  title={t("admin_users.btn_clear")}
                >
                  <TbX size={18} />
                </button>
              }
            >
              <div
                className={`${styles.previewArea} ${!previewUrl || previewError ? styles.previewAreaEmpty : ""}`}
              >
                {isPreviewLoading && (
                  <div className={styles.loadingOverlay}>
                    {t("admin_zpl.preview_loading", "Đang tải preview...")}
                  </div>
                )}
                {previewUrl && !previewError ? (
                  <img
                    src={previewUrl}
                    alt="ZPL Preview"
                    className={styles.previewImage}
                    onLoad={() => setIsPreviewLoading(false)}
                    onError={() => {
                      setIsPreviewLoading(false);
                      setPreviewError(true);
                    }}
                  />
                ) : (
                  previewError && (
                    <div className={styles.previewPlaceholder}>
                      <span>
                        {t(
                          "admin_zpl.preview_error",
                          "Không thể tải preview. Kiểm tra lại mã ZPL.",
                        )}
                      </span>
                    </div>
                  )
                )}
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
