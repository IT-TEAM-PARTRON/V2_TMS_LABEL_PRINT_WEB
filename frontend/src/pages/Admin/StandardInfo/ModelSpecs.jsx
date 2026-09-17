import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  TbDeviceFloppy,
  TbFilePlus,
  TbListDetails,
  TbRefresh,
  TbSearch,
  TbTrash,
  TbUserEdit,
  TbX,
} from "react-icons/tb";
import CustomAlertModal from "../../../components/Modal/CustomAlertModal.jsx";
import CustomComboBox from "../../../components/Combobox/CustomCombobox.jsx";
import CustomConfirmModal from "../../../components/Modal/CustomConfirmModal.jsx";
import CustomInput from "../../../components/Input/CustomInput.jsx";
import CustomSection from "../../../components/Section/CustomSection.jsx";
import CustomTable from "../../../components/Table/CustomTable.jsx";
import { getAllFactories } from "../../../api/admin/generalApi.js";
import {
  createModel,
  deleteModel,
  getAllModels,
  updateModel,
} from "../../../api/admin/standardApi.js";
import styles from "./ModelSpecs.module.css";

const EMPTY_FORM = {
  ID: null,
  MODELID: "",
  MATERIALSCODE: "",
  PRODUCT: "",
  PRODUCTFACTORY: "",
  SUPPLIER: "",
  DESCRIPTION: "",
};

const REQUIRED_FIELDS = [
  "MODELID",
  "MATERIALSCODE",
  "PRODUCT",
  "PRODUCTFACTORY",
  "SUPPLIER",
];

export default function ModelSpecs() {
  const { t } = useTranslation();
  const [models, setModels] = useState([]);
  const [factoryOptions, setFactoryOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: "success", title: "", message: "" });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, idToDelete: null });

  const showAlert = useCallback((type, title, message) => {
    setAlertModal({ isOpen: true, type, title, message });
  }, []);

  const fetchModels = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getAllModels();
      if (!response.data.success) throw new Error(response.data.message);
      setModels(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      setModels([]);
      showAlert("error", t("admin_users.error", "Error"), error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  }, [showAlert, t]);

  const fetchFactories = useCallback(async () => {
    try {
      const response = await getAllFactories();
      const factories = Array.isArray(response.data.data) ? response.data.data : [];
      setFactoryOptions(factories.map((factory) => ({ value: factory.FACTORYID, label: factory.FACTORYID })));
    } catch (error) {
      setFactoryOptions([]);
      showAlert("error", t("admin_users.error", "Error"), error.response?.data?.message || error.message);
    }
  }, [showAlert, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void Promise.all([fetchModels(), fetchFactories()]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchFactories, fetchModels, t]);

  const filteredModels = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return models;
    return models.filter((model) =>
      [model.MODELID, model.MATERIALSCODE, model.PRODUCT, model.PRODUCTFACTORY, model.SUPPLIER]
        .some((value) => String(value || "").toLowerCase().includes(keyword)),
    );
  }, [models, searchTerm]);

  const clearForm = () => setFormData(EMPTY_FORM);

  const buildPayload = () => ({
    MODELID: formData.MODELID.trim().toUpperCase(),
    MATERIALSCODE: formData.MATERIALSCODE.trim(),
    PRODUCT: formData.PRODUCT.trim(),
    PRODUCTFACTORY: formData.PRODUCTFACTORY.trim(),
    SUPPLIER: formData.SUPPLIER.trim(),
    DESCRIPTION: formData.DESCRIPTION.trim(),
  });

  const validateForm = () => {
    if (REQUIRED_FIELDS.some((field) => !String(formData[field] || "").trim())) {
      showAlert("error", t("admin_users.error", "Error"), t("admin_model.required_fields", "Please enter all required fields."));
      return false;
    }
    return true;
  };

  const saveModel = async (mode) => {
    if (!validateForm()) return;
    try {
      setIsSaving(true);
      const response = mode === "create"
        ? await createModel(buildPayload())
        : await updateModel(formData.ID, buildPayload());
      showAlert("success", t("admin_users.success", "Success"), response.data.message);
      clearForm();
      await fetchModels();
    } catch (error) {
      showAlert("error", t("admin_users.error", "Error"), error.response?.data?.message || error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    const id = confirmModal.idToDelete;
    if (!id) return;
    try {
      const response = await deleteModel(id);
      showAlert("success", t("admin_users.success", "Success"), response.data.message);
      if (Number(formData.ID) === Number(id)) clearForm();
      await fetchModels();
    } catch (error) {
      showAlert("error", t("admin_users.error", "Error"), error.response?.data?.message || error.message);
    } finally {
      setConfirmModal({ isOpen: false, idToDelete: null });
    }
  };

  const columns = [
    { key: "no", title: t("table.no", "NO"), align: "center", width: "55px", render: (_, index) => index + 1 },
    { key: "MODELID", title: t("admin_model.modelid", "MODEL ID"), width: "110px", render: (row) => <span className={styles.highlightText}>{row.MODELID}</span> },
    { key: "MATERIALSCODE", dataIndex: "MATERIALSCODE", title: t("admin_model.materials_code", "MATERIALS CODE"), width: "150px" },
    { key: "PRODUCT", dataIndex: "PRODUCT", title: t("admin_model.product", "PRODUCT"), width: "150px" },
    { key: "PRODUCTFACTORY", dataIndex: "PRODUCTFACTORY", title: t("admin_model.product_factory", "PRODUCT FACTORY"), width: "150px" },
    { key: "SUPPLIER", dataIndex: "SUPPLIER", title: t("admin_model.supplier", "SUPPLIER"), width: "130px" },
    { key: "DESCRIPTION", dataIndex: "DESCRIPTION", title: t("admin_model.description", "DESCRIPTION"), width: "200px" },
    { key: "EVENTUSER", dataIndex: "EVENTUSER", title: t("admin_model.event_user", "EVENT USER"), width: "130px" },
    { key: "EVENTTIME", dataIndex: "EVENTTIME", title: t("admin_model.event_time", "EVENT TIME"), width: "165px" },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.splitLayout}>
        <div className={styles.leftPane}>
          <CustomSection
            title={<div className={styles.sectionTitle}><TbListDetails className={styles.sectionIcon} size={20} /><span>{t("admin_users.list", "List")} {isLoading && "..."}</span></div>}
            badge={`${filteredModels.length}`}
            extra={<div className={styles.headerToolbar}><div className={styles.searchBox}><TbSearch className={styles.searchIcon} size={16} /><input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />{searchTerm && <TbX className={styles.clearSearch} onClick={() => setSearchTerm("")} />}</div></div>}
          >
            <CustomTable columns={columns} data={filteredModels} rowKey="ID" maxHeight="calc(100vh - 150px)" onRowClick={(model) => setFormData({ ...EMPTY_FORM, ...model })} activeRowId={formData.ID} enableResize />
          </CustomSection>
        </div>

        <div className={styles.rightPane}>
          <div className={styles.rightPaneInner}>
            <CustomSection
              noPaddingSidesBottom={false}
              title={<div className={styles.sectionTitle}><TbUserEdit className={styles.sectionIcon} size={20} /><span>{t("admin_users.form_edit", "Editor")}</span></div>}
              extra={<button onClick={clearForm} className={styles.clearFormBtn} title={t("admin_users.btn_clear", "Clear")}><TbRefresh size={18} /></button>}
            >
              <div className={styles.topActionButtons}>
                <button className={styles.textButton} onClick={() => void saveModel("create")} disabled={isSaving}><TbFilePlus size={16} />{t("admin_users.btn_create", "Create")}</button>
                <button className={styles.textButton} onClick={() => void saveModel("update")} disabled={isSaving || !formData.ID}><TbDeviceFloppy size={16} />{t("admin_users.btn_update", "Update")}</button>
                <button className={styles.textButton} onClick={() => setConfirmModal({ isOpen: true, idToDelete: formData.ID })} disabled={isSaving || !formData.ID}><TbTrash size={16} />{t("admin_users.btn_delete", "Delete")}</button>
              </div>
              <div className={styles.formContainer}>
                <CustomInput label={t("admin_model.modelid", "Model ID")} required maxLength={10} value={formData.MODELID} onChange={(event) => setFormData({ ...formData, MODELID: event.target.value.toUpperCase() })} labelWidth="140px" />
                <CustomInput label={t("admin_model.materials_code", "Materials Code")} required maxLength={50} value={formData.MATERIALSCODE} onChange={(event) => setFormData({ ...formData, MATERIALSCODE: event.target.value })} labelWidth="140px" />
                <CustomInput label={t("admin_model.product", "Product")} required maxLength={50} value={formData.PRODUCT} onChange={(event) => setFormData({ ...formData, PRODUCT: event.target.value })} labelWidth="140px" />
                <CustomComboBox label={t("admin_model.product_factory", "Product Factory")} required options={factoryOptions} value={formData.PRODUCTFACTORY} onChange={(value) => setFormData({ ...formData, PRODUCTFACTORY: value })} labelWidth="140px" />
                <CustomInput label={t("admin_model.supplier", "Supplier")} required maxLength={50} value={formData.SUPPLIER} onChange={(event) => setFormData({ ...formData, SUPPLIER: event.target.value })} labelWidth="140px" />
                <CustomInput label={t("admin_model.description", "Description")} value={formData.DESCRIPTION} onChange={(event) => setFormData({ ...formData, DESCRIPTION: event.target.value })} labelWidth="140px" />
              </div>
            </CustomSection>
          </div>
        </div>
      </div>

      <CustomAlertModal {...alertModal} onClose={() => setAlertModal((current) => ({ ...current, isOpen: false }))} />
      <CustomConfirmModal
        {...confirmModal}
        title={t("admin_users.confirm_delete", "Confirm delete")}
        message={`${t("admin_users.content1", "Delete")} "${formData.MODELID}"?`}
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, idToDelete: null })}
        confirmText={t("admin_users.confirm", "Confirm")}
        cancelText={t("admin_users.cancel", "Cancel")}
        isDanger
      />
    </div>
  );
}
