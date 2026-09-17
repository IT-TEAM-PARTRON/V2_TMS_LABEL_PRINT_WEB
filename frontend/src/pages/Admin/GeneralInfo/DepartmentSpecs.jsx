import { useState, useEffect, useMemo, useCallback } from "react";
import CustomSection from "../../../components/Section/CustomSection.jsx";
import CustomInput from "../../../components/Input/CustomInput.jsx";
import CustomButton from "../../../components/Button/CustomButton.jsx";
import CustomTable from "../../../components/Table/CustomTable.jsx";
import CustomComboBox from "../../../components/Combobox/CustomCombobox.jsx";
import CustomConfirmModal from "../../../components/Modal/CustomConfirmModal.jsx";
import CustomAlertModal from "../../../components/Modal/CustomAlertModal.jsx";
import styles from "./DepartmentSpecs.module.css";
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
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllFactories,
} from "../../../api/admin/generalApi.js";
import { useTranslation } from "react-i18next";

const EMPTY_FORM = {
  ID: null,
  FACTORYID: "",
  DEPARTMENTID: "",
};

export default function DepartmentSpecs() {
  const { t } = useTranslation();

  const [departments, setDepartments] = useState([]);
  const [factoryOptions, setFactoryOptions] = useState([]);
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
      const { success, data } = response.data;
      if (success && Array.isArray(data)) {
        setFactoryOptions(
          data.map((item) => ({
            value: item.FACTORYID,
            label: item.FACTORYID,
          })),
        );
      }
    } catch (error) {
      console.error("Fetch Factories Error:", error);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await getAllDepartments();
      const { success, data, message } = response.data;
      if (!success) throw new Error(message);
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      showAlert(
        "error",
        t("admin_users.error"),
        error.response?.data?.message || error.message,
      );
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  }, [showAlert, t]);

  useEffect(() => {
    const fetchTimer = setTimeout(() => {
      fetchDepartments();
      fetchFactories();
    }, 0);
    return () => clearTimeout(fetchTimer);
  }, [fetchDepartments, fetchFactories]);

  const filteredDepartments = useMemo(() => {
    if (!searchTerm) return departments;
    const lowerTerm = searchTerm.toLowerCase();
    return departments.filter(
      (d) =>
        (d.DEPARTMENTID && d.DEPARTMENTID.toLowerCase().includes(lowerTerm)) ||
        (d.FACTORYID && d.FACTORYID.toLowerCase().includes(lowerTerm)),
    );
  }, [departments, searchTerm]);

  const handleClearForm = () => {
    setFormData(EMPTY_FORM);
  };

  const handleSelectDepartment = (dept) => {
    setFormData({ ...dept });
  };

  const handleActionCreate = async () => {
    if (!formData.FACTORYID || !formData.DEPARTMENTID) {
      showAlert(
        "error",
        t("admin_users.error"),
        t("admin_users.create_error2"),
      );
      return;
    }

    const isDuplicate = departments.some(
      (d) =>
        d.FACTORYID === formData.FACTORYID.trim() &&
        d.DEPARTMENTID.toLowerCase() ===
        formData.DEPARTMENTID.trim().toLowerCase(),
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
        FACTORYID: formData.FACTORYID.trim(),
        DEPARTMENTID: formData.DEPARTMENTID.trim().toUpperCase(),
      };
      const response = await createDepartment(payload);
      showAlert("success", t("admin_users.success"), response.data.message);
      handleClearForm();
      await fetchDepartments();
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
    if (!formData.FACTORYID || !formData.DEPARTMENTID) {
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
        FACTORYID: formData.FACTORYID.trim(),
        DEPARTMENTID: formData.DEPARTMENTID.trim().toUpperCase(),
      };
      const response = await updateDepartment(formData.ID, payload);
      showAlert("success", t("admin_users.success"), response.data.message);
      handleClearForm();
      await fetchDepartments();
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
      const response = await deleteDepartment(id);
      showAlert("success", t("admin_users.success"), response.data.message);
      if (formData.ID === id) handleClearForm();
      await fetchDepartments();
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
      width: "60px",
      render: (_, idx) => String(idx + 1).padStart(2, "0"),
    },
    {
      key: "FACTORYID",
      title: t("admin_department.factoryid", "FACTORYID"),
      align: "left",
      render: (row) => (
        <span>{row.FACTORYID}</span>
      ),
    },
    {
      key: "DEPARTMENTID",
      title: t("admin_department.departmentid", "DEPARTMENTID"),
      align: "left",
      width: "150px",
      render: (row) => <span>{row.DEPARTMENTID}</span>,
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
            badge={`${filteredDepartments.length}`}
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
              data={filteredDepartments}
              rowKey="ID"
              maxHeight="calc(100vh - 150px)"
              onRowClick={(row) => handleSelectDepartment(row)}
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
                <CustomComboBox
                  label={t("admin_department.factoryid", "Factory ID")}
                  required
                  options={factoryOptions}
                  value={formData.FACTORYID}
                  onChange={(val) =>
                    setFormData({ ...formData, FACTORYID: val })
                  }
                  labelWidth="120px"
                />
                <CustomInput
                  label={t("admin_department.departmentid", "Department ID")}
                  required
                  value={formData.DEPARTMENTID}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      DEPARTMENTID: e.target.value.toUpperCase(),
                    })
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
        message={`${t("admin_users.content1")} "${formData.DEPARTMENTID}" ${t("admin_users.content2")}`}
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, idToDelete: null })}
        confirmText={t("admin_users.confirm")}
        cancelText={t("admin_users.cancel")}
        isDanger={true}
      />
    </div>
  );
}
