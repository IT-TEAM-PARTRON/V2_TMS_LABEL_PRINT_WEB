import { useState, useEffect, useMemo, useCallback } from "react";
import CustomSection from "../../../components/Section/CustomSection.jsx";
import CustomInput from "../../../components/Input/CustomInput.jsx";
import CustomButton from "../../../components/Button/CustomButton.jsx";
import CustomTable from "../../../components/Table/CustomTable.jsx";
import CustomConfirmModal from "../../../components/Modal/CustomConfirmModal.jsx";
import CustomAlertModal from "../../../components/Modal/CustomAlertModal.jsx";
import styles from "./FactorySpecs.module.css";
import {
  TbListDetails,
  TbUserEdit,
  TbTrash,
  TbDeviceFloppy,
  TbFilePlus,
  TbX,
  TbSearch,
  TbRefresh,
} from "react-icons/tb";

import {
  getAllFactories,
  createFactory,
  updateFactory,
  deleteFactory,
} from "../../../api/admin/generalApi.js";
import { useTranslation } from "react-i18next";

const EMPTY_FORM = {
  ID: null,
  FACTORYID: "",
  DESCRIPTION: "",
};

export default function FactorySpecs() {
  const { t } = useTranslation();

  const [factories, setFactories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    idToDelete: null,
  });

  const showAlert = useCallback((type, title, message) => {
    setAlertModal({ isOpen: true, type, title, message });
  }, []);

  const fetchFactories = useCallback(async () => {
    try {
      const response = await getAllFactories();
      const { success, data, message } = response.data;
      if (!success) throw new Error(message);
      setFactories(Array.isArray(data) ? data : []);
    } catch (error) {
      showAlert(
        "error",
        t("admin_users.error"),
        error.response?.data?.message || error.message,
      );
      setFactories([]);
    } finally {
      setIsLoading(false);
    }
  }, [showAlert, t]);

  useEffect(() => {
    const fetchTimer = setTimeout(fetchFactories, 0);
    return () => clearTimeout(fetchTimer);
  }, [fetchFactories]);

  const filteredFactories = useMemo(() => {
    if (!searchTerm) return factories;
    const lowerTerm = searchTerm.toLowerCase();
    return factories.filter(
      (f) =>
        (f.FACTORYID && f.FACTORYID.toLowerCase().includes(lowerTerm)) ||
        (f.DESCRIPTION && f.DESCRIPTION.toLowerCase().includes(lowerTerm)),
    );
  }, [factories, searchTerm]);

  const handleClearForm = () => {
    setFormData(EMPTY_FORM);
  };

  const handleSelectFactory = (factory) => {
    setFormData({ ...factory });
  };

  const handleActionCreate = async () => {
    if (!formData.FACTORYID) {
      showAlert(
        "error",
        t("admin_users.error"),
        t("admin_users.create_error2"),
      );
      return;
    }

    const isDuplicate = factories.some(
      (f) =>
        f.FACTORYID.toLowerCase() === formData.FACTORYID.trim().toLowerCase(),
    );
    if (isDuplicate) {
      showAlert(
        "error",
        t("admin_users.error"),
        t("admin_users.create_error1"),
      );
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        FACTORYID: formData.FACTORYID.trim().toUpperCase(),
        DESCRIPTION: formData.DESCRIPTION || "",
      };
      const response = await createFactory(payload);
      showAlert("success", t("admin_users.success"), response.data.message);
      handleClearForm();
      await fetchFactories();
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

  const handleActionUpdate = async () => {
    if (!formData.FACTORYID) {
      showAlert(
        "error",
        t("admin_users.error"),
        t("admin_users.create_error2"),
      );
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        FACTORYID: formData.FACTORYID.trim().toUpperCase(),
        DESCRIPTION: formData.DESCRIPTION || "",
      };
      const response = await updateFactory(formData.ID, payload);
      showAlert("success", t("admin_users.success"), response.data.message);
      handleClearForm();
      await fetchFactories();
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

  const handleDeleteClick = (id) => {
    setConfirmModal({ isOpen: true, idToDelete: id });
  };

  const executeDelete = async () => {
    const id = confirmModal.idToDelete;
    if (!id) return;
    try {
      const response = await deleteFactory(id);
      showAlert("success", t("admin_users.success"), response.data.message);
      if (formData.ID === id) handleClearForm();
      await fetchFactories();
    } catch (error) {
      showAlert(
        "error",
        t("admin_users.error"),
        error.response?.data?.message || error.message,
      );
    } finally {
      setConfirmModal({ isOpen: false, idToDelete: null });
    }
  };

  const columns = [
    {
      key: "no",
      title: t("table.no", "NO"),
      align: "center",
      width: "50px",
      render: (_, idx) => String(idx + 1).padStart(2, "0"),
    },
    {
      key: "FACTORYID",
      title: t("admin_factory.factoryid", "FACTORYID"),
      align: "left",
      render: (row) => <span>{row.FACTORYID}</span>,
    },
    {
      key: "DESCRIPTION",
      title: t("admin_factory.description", "DESCRIPTION"),
      align: "left",
      width: "200px",
      render: (row) => <span>{row.DESCRIPTION || "-"}</span>,
    },

  ];

  return (
    <div className={styles.page}>
      <div className={styles.splitLayout}>
        {/* ── BÊN TRÁI: DANH SÁCH ── */}
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
            badge={`${filteredFactories.length}`}
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
              </div>
            }
          >
            <CustomTable
              columns={columns}
              data={filteredFactories}
              rowKey="ID"
              maxHeight="calc(100vh - 150px)"
              onRowClick={(row) => handleSelectFactory(row)}
              activeRowId={formData.ID}
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
                  <span>EDITOR</span>
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
                  onClick={handleActionCreate}
                  disabled={isSaving}
                >
                  <TbFilePlus size={16} />
                  {isSaving
                    ? t("admin_users.saving")
                    : t("admin_users.btn_create")}
                </button>

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
                  onClick={() => handleDeleteClick(formData.ID)}
                  disabled={isSaving || !formData.ID}
                >
                  <TbTrash size={16} />
                  {t("admin_users.btn_delete")}
                </button>

              </div>

              <div className={styles.formContainer}>
                <CustomInput
                  label={t("admin_factory.factoryid", "Factory ID")}
                  required
                  value={formData.FACTORYID}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      FACTORYID: e.target.value.toUpperCase(),
                    })
                  }
                  labelWidth="120px"
                />
                <CustomInput
                  label={t("admin_factory.description", "Description")}
                  value={formData.DESCRIPTION || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, DESCRIPTION: e.target.value })
                  }
                  labelWidth="120px"
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
      <CustomConfirmModal
        {...confirmModal}
        title={t("admin_users.confirm_delete")}
        message={`${t("admin_users.content1")} "${formData.FACTORYID}" ${t("admin_users.content2")}`}
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, idToDelete: null })}
        confirmText={t("admin_users.confirm")}
        cancelText={t("admin_users.cancel")}
        isDanger={true}
      />
    </div>
  );
}
