import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  TbDeviceFloppy,
  TbPhoto,
  TbPrinter,
  TbRefresh,
  TbSettings,
} from "react-icons/tb";
import {
  createBoxLabel,
  getBoxLabelModels,
  getBoxLabelTemplate,
} from "../../../api/packing/outboxApi.js";
import CustomComboBox from "../../../components/Combobox/CustomCombobox.jsx";
import CustomButton from "../../../components/Button/CustomButton.jsx";
import CustomInput from "../../../components/Input/CustomInput.jsx";
import CustomAlertModal from "../../../components/Modal/CustomAlertModal.jsx";
import { sendZplCode, setupWebPrint } from "../../../utils/zebraPrinter.js";
import styles from "./Outbox.module.css";

const EMPTY_FORM = {
  modelId: "",
  expirationDate: "",
  quantity: "",
  remarks: "",
};

const getSavedOffset = (axis) =>
  Number(localStorage.getItem(`boxLabelOffset${axis}`)) || 0;

const cleanZplValue = (value) =>
  String(value ?? "")
    .replace(/[\^~]/g, " ")
    .replace(/[\r\n]+/g, " ");

const buildBoxLabelZpl = (template, data, offsetX, offsetY) => {
  const replacements = {
    X: offsetX,
    Y: offsetY,
    QRCODE: data.QRCODE,
    MATERIALSCODE: data.MATERIALSCODE,
    PRODUCT: data.PRODUCT,
    SUPPLIER: data.SUPPLIER,
    QUANTITY: data.QUANTITY,
    LOTNO: data.LOTNO,
    EXPIRATIONDATE: data.EXPIRATIONDATE,
    REMARKS: data.REMARKS,
  };

  return Object.entries(replacements).reduce(
    (zpl, [key, value]) => zpl.replaceAll(`{${key}}`, cleanZplValue(value)),
    template,
  );
};

export default function BoxLabel() {
  const { t } = useTranslation();
  const [models, setModels] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isTestPrinting, setIsTestPrinting] = useState(false);
  const [printerName, setPrinterName] = useState("");
  const [pendingLabel, setPendingLabel] = useState(null);
  const [lastLabel, setLastLabel] = useState(null);
  const [offsetX, setOffsetX] = useState(() => getSavedOffset("X"));
  const [offsetY, setOffsetY] = useState(() => getSavedOffset("Y"));
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const currentLabel = pendingLabel || lastLabel;

  const showAlert = useCallback((type, title, message) => {
    setAlertModal({ isOpen: true, type, title, message });
  }, []);

  const connectPrinter = useCallback(
    async ({ silent = false } = {}) => {
      try {
        const printer = await setupWebPrint();
        setPrinterName(printer.name);
      } catch (error) {
        setPrinterName("");
        if (!silent) {
          showAlert("error", t("general_title.error", "Error"), error.message);
        }
      }
    },
    [showAlert, t],
  );

  const fetchModels = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getBoxLabelModels();
      if (!response.data.success) throw new Error(response.data.message);
      setModels(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      setModels([]);
      showAlert(
        "error",
        t("general_title.error", "Error"),
        error.response?.data?.message || error.message,
      );
    } finally {
      setIsLoading(false);
    }
  }, [showAlert, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchModels(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchModels, t]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => void connectPrinter({ silent: true }),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [connectPrinter]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const selectedModel = useMemo(
    () =>
      models.find((model) => String(model.ID) === String(formData.modelId)) ||
      null,
    [formData.modelId, models],
  );

  const modelOptions = useMemo(
    () =>
      models.map((model) => ({
        value: String(model.ID),
        label: model.MODELID,
      })),
    [models],
  );

  const hasValidRequiredInput = useMemo(() => {
    const quantity = Number(formData.quantity);
    return Boolean(
      selectedModel &&
      formData.expirationDate &&
      Number.isInteger(quantity) &&
      quantity > 0 &&
      quantity <= 99999,
    );
  }, [formData.expirationDate, formData.quantity, selectedModel]);

  const canPrint = Boolean(
    printerName &&
    !isLoading &&
    !isPrinting &&
    (pendingLabel || hasValidRequiredInput),
  );

  const saveOffsets = () => {
    localStorage.setItem("boxLabelOffsetX", String(offsetX));
    localStorage.setItem("boxLabelOffsetY", String(offsetY));
    showAlert(
      "success",
      t("general_title.success", "Success"),
      t("box_label.offset_saved", "Print position saved."),
    );
  };

  const validateForm = () => {
    if (!formData.modelId || !formData.expirationDate || !formData.quantity) {
      showAlert(
        "error",
        t("general_title.error", "Error"),
        t("box_label.required_fields", "Please enter all required fields."),
      );
      return false;
    }
    const quantity = Number(formData.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99999) {
      showAlert(
        "error",
        t("general_title.error", "Error"),
        t(
          "box_label.invalid_quantity",
          "Quantity must be an integer from 1 to 99999.",
        ),
      );
      return false;
    }
    return true;
  };

  const buildDraftLabel = (zplCode) => ({
    ZPLCODE: zplCode,
    QRCODE: currentLabel?.QRCODE || "",
    MATERIALSCODE: selectedModel?.MATERIALSCODE || "",
    PRODUCT: selectedModel?.PRODUCT || "",
    SUPPLIER: selectedModel?.SUPPLIER || "",
    QUANTITY: formData.quantity || "",
    LOTNO: currentLabel?.LOTNO || "",
    EXPIRATIONDATE: formData.expirationDate || "",
    REMARKS: formData.remarks || "",
  });

  const printLabel = async () => {
    if (!printerName) {
      showAlert(
        "warning",
        t("general_title.warning", "Warning"),
        t(
          "box_label.connect_printer_first",
          "Connect the Zebra printer first.",
        ),
      );
      return;
    }
    if (!pendingLabel && !validateForm()) return;

    setIsPrinting(true);
    let label = pendingLabel;
    try {
      if (!label) {
        const response = await createBoxLabel({
          modelId: Number(formData.modelId),
          expirationDate: formData.expirationDate,
          quantity: Number(formData.quantity),
          remarks: formData.remarks,
        });
        label = response.data.data;
        setPendingLabel(label);
        setLastLabel(label);
      }

      await sendZplCode(
        buildBoxLabelZpl(label.ZPLCODE, label, offsetX, offsetY),
      );
      setPendingLabel(null);
      setFormData((current) => ({
        ...current,
        expirationDate: "",
        quantity: "",
        remarks: "",
      }));
      showAlert(
        "success",
        t("general_title.success", "Success"),
        `${t("box_label.print_success", "Box Label printed successfully")}: ${label.LOTNO}`,
      );
    } catch (error) {
      const prefix = label
        ? t(
            "box_label.saved_print_failed",
            "Label was saved. Retry printing the same Lot No.",
          )
        : "";
      showAlert(
        "error",
        t("general_title.error", "Error"),
        [prefix, error.response?.data?.message || error.message]
          .filter(Boolean)
          .join(" "),
      );
    } finally {
      setIsPrinting(false);
    }
  };

  const previewLabel = async () => {
    if (!selectedModel) return;
    setIsPreviewLoading(true);
    setPreviewError("");
    try {
      const responseTemplate = await getBoxLabelTemplate("BOX_LABEL");
      const draftLabel = buildDraftLabel(responseTemplate.data.data.ZPLCODE);
      const zpl = buildBoxLabelZpl(
        draftLabel.ZPLCODE,
        draftLabel,
        offsetX,
        offsetY,
      );
      const response = await fetch(
        "https://api.labelary.com/v1/printers/12dpmm/labels/2.6772x1.5748/0/",
        {
          method: "POST",
          headers: {
            Accept: "image/png",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: zpl,
        },
      );
      if (!response.ok) throw new Error(`Labelary error ${response.status}`);
      const objectUrl = URL.createObjectURL(await response.blob());
      setPreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return objectUrl;
      });
    } catch (error) {
      setPreviewError(error.message);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const printTestLabel = async () => {
    if (!selectedModel) return;
    if (!printerName) {
      showAlert(
        "warning",
        t("general_title.warning", "Warning"),
        t(
          "box_label.connect_printer_first",
          "Connect the Zebra printer first.",
        ),
      );
      return;
    }
    setIsTestPrinting(true);
    try {
      const response = await getBoxLabelTemplate("BOX_LABEL_TEST");
      const draftLabel = buildDraftLabel(response.data.data.ZPLCODE);
      await sendZplCode(
        buildBoxLabelZpl(draftLabel.ZPLCODE, draftLabel, offsetX, offsetY),
      );
      showAlert(
        "success",
        t("general_title.success", "Success"),
        t("box_label.print_test_success", "Test label printed successfully."),
      );
    } catch (error) {
      showAlert(
        "error",
        t("general_title.error", "Error"),
        error.response?.data?.message || error.message,
      );
    } finally {
      setIsTestPrinting(false);
    }
  };

  const resetForm = () => {
    if (pendingLabel) {
      showAlert(
        "warning",
        t("general_title.warning", "Warning"),
        t(
          "box_label.retry_pending",
          "Retry the saved label before creating another label.",
        ),
      );
      return;
    }
    setFormData(EMPTY_FORM);
    setLastLabel(null);
    setPreviewError("");
    setPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return "";
    });
  };

  const selectModel = (modelId) => {
    setFormData({ ...EMPTY_FORM, modelId });
    setLastLabel(null);
    setPreviewError("");
    setPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return "";
    });
  };

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <TbPrinter size={18} />
            <span>{t("box_label.information", "Information")}</span>
          </div>
          <CustomButton
            className={styles.headerIconButton}
            type="default"
            icon={<TbRefresh size={18} />}
            onClick={resetForm}
            title={t("admin_users.btn_clear", "Clear")}
            aria-label={t("admin_users.btn_clear", "Clear")}
          />
        </header>

        <div className={styles.informationBody}>
          <div className={styles.modelRow}>
            <CustomComboBox
              label={t("box_label.model", "Model")}
              required
              options={modelOptions}
              value={formData.modelId}
              onChange={selectModel}
              disabled={Boolean(pendingLabel)}
              labelWidth="130px"
            />
          </div>

          <div className={styles.detailsWrapper}>
            <section className={styles.fieldSection}>
              <div className={styles.formGrid}>
                <CustomInput
                  label={t("box_label.lot_no", "Lot No.")}
                  value={currentLabel?.LOTNO || ""}
                  disabled
                  labelWidth="130px"
                />
                <CustomInput
                  label={t("box_label.materials_code", "Materials Code")}
                  value={selectedModel?.MATERIALSCODE || ""}
                  disabled
                  labelWidth="130px"
                />
                <CustomInput
                  label={t("box_label.product", "Product")}
                  value={selectedModel?.PRODUCT || ""}
                  disabled
                  labelWidth="130px"
                />
                <CustomInput
                  label={t("box_label.supplier", "Supplier")}
                  value={selectedModel?.SUPPLIER || ""}
                  disabled
                  labelWidth="130px"
                />
                <CustomInput
                  label={t(
                    "box_label.production_factory",
                    "Production Factory",
                  )}
                  value={selectedModel?.PRODUCTFACTORY || ""}
                  disabled
                  labelWidth="130px"
                />
              </div>
            </section>

            <section className={styles.fieldSection}>
              <div className={styles.formGrid}>
                <CustomInput
                  label={t("box_label.expiration_date", "Expiration date")}
                  required
                  type="date"
                  value={formData.expirationDate}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      expirationDate: event.target.value,
                    })
                  }
                  disabled={!selectedModel || Boolean(pendingLabel)}
                  labelWidth="130px"
                />
                <CustomInput
                  label={t("box_label.quantity", "Quantity")}
                  required
                  type="number"
                  min="1"
                  max="99999"
                  step="1"
                  value={formData.quantity}
                  onChange={(event) =>
                    setFormData({ ...formData, quantity: event.target.value })
                  }
                  disabled={!selectedModel || Boolean(pendingLabel)}
                  labelWidth="130px"
                />
                <CustomInput
                  label={t("box_label.remarks", "Remarks")}
                  maxLength={250}
                  value={formData.remarks}
                  onChange={(event) =>
                    setFormData({ ...formData, remarks: event.target.value })
                  }
                  disabled={!selectedModel || Boolean(pendingLabel)}
                  labelWidth="130px"
                />
              </div>
            </section>
          </div>
        </div>

        <footer className={styles.leftFooter}>
          <CustomButton
            className={styles.printButton}
            type="primary"
            icon={<TbPrinter size={19} />}
            onClick={() => void printLabel()}
            disabled={!canPrint}
          >
            {isPrinting
              ? t("box_label.printing", "Printing...")
              : pendingLabel
                ? t("box_label.retry_print", "Retry print")
                : t("box_label.print", "Print")}
          </CustomButton>
        </footer>
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <TbSettings size={18} />
            <span>{t("box_label.config_preview", "Config & Preview")}</span>
          </div>
        </header>

        <div className={styles.configBody}>
          <div className={styles.configToolbar}>
            <CustomButton
              className={`${styles.printerCard} ${printerName ? styles.printerOnline : ""}`}
              type="default"
              icon={<TbPrinter size={25} />}
              onClick={() => void connectPrinter()}
            >
              <span className={styles.printerText}>
                <strong>
                  {printerName ||
                    t("box_label.printer_not_found", "Printer not found")}
                </strong>
                <small>
                  {printerName
                    ? t("box_label.online", "Online")
                    : t("box_label.offline", "Offline / Not Found")}
                </small>
              </span>
              <TbRefresh className={styles.refreshIcon} size={19} />
            </CustomButton>

            <div className={styles.offsetControls}>
              <label>
                X
                <input
                  type="number"
                  value={offsetX}
                  onChange={(event) => setOffsetX(Number(event.target.value))}
                />
              </label>
              <label>
                Y
                <input
                  type="number"
                  value={offsetY}
                  onChange={(event) => setOffsetY(Number(event.target.value))}
                />
              </label>
              <CustomButton
                className={styles.saveButton}
                type="create"
                icon={<TbDeviceFloppy size={17} />}
                onClick={saveOffsets}
              >
                {t("box_label.save", "Save")}
              </CustomButton>
            </div>
          </div>

          <div className={styles.previewArea}>
            {isPreviewLoading ? (
              <div className={styles.previewPlaceholder}>
                {t("box_label.preview_loading", "Loading preview...")}
              </div>
            ) : previewUrl && !previewError ? (
              <img
                src={previewUrl}
                alt="Box Label Preview"
                className={styles.previewImage}
              />
            ) : (
              <div className={styles.previewPlaceholder}>
                <TbPhoto size={44} />
                <span>
                  {previewError ||
                    t("box_label.preview_hint", "Click Preview to see label")}
                </span>
              </div>
            )}
          </div>
        </div>

        <footer className={styles.previewFooter}>
          {selectedModel && (
            <CustomButton
              className={styles.previewButton}
              type="default"
              icon={<TbPhoto size={17} />}
              onClick={() => void previewLabel()}
              disabled={isPreviewLoading}
            >
              {t("box_label.preview", "Preview")}
            </CustomButton>
          )}
          <CustomButton
            className={styles.testButton}
            type="default"
            icon={<TbPrinter size={17} />}
            onClick={() => void printTestLabel()}
            disabled={!selectedModel || !printerName || isTestPrinting}
          >
            {isTestPrinting
              ? t("box_label.printing", "Printing...")
              : t("box_label.print_test", "Print Test")}
          </CustomButton>
        </footer>
      </section>

      <CustomAlertModal
        {...alertModal}
        onClose={() =>
          setAlertModal((current) => ({ ...current, isOpen: false }))
        }
      />
    </div>
  );
}
