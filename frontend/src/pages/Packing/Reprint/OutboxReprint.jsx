import { useCallback, useEffect, useRef, useState } from "react";
import {
  TbDeviceFloppy,
  TbPhoto,
  TbPrinter,
  TbRefresh,
  TbRotateClockwise2,
  TbSettings,
} from "react-icons/tb";
import { useTranslation } from "react-i18next";
import {
  logReprint,
  lookupReprintLabel,
} from "../../../api/packing/reprintApi.js";
import CustomButton from "../../../components/Button/CustomButton.jsx";
import CustomInput from "../../../components/Input/CustomInput.jsx";
import CustomAlertModal from "../../../components/Modal/CustomAlertModal.jsx";
import { sendZplCode, setupWebPrint } from "../../../utils/zebraPrinter.js";
import styles from "./OutboxReprint.module.css";

const getSavedOffset = (axis) =>
  Number(localStorage.getItem(`boxLabelOffset${axis}`)) || 0;

const getSavedDensity = () => {
  const savedDensity = String(
    localStorage.getItem("boxLabelDensity") || "203DPI",
  ).toUpperCase();
  return ["203DPI", "300DPI"].includes(savedDensity)
    ? savedDensity
    : "203DPI";
};

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

export default function OutboxReprint() {
  const { t } = useTranslation();
  const scanInputRef = useRef(null);
  const [scanCode, setScanCode] = useState("");
  const [labelData, setLabelData] = useState(null);
  const [reprintCount, setReprintCount] = useState(0);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printerName, setPrinterName] = useState("");
  const [offsetX, setOffsetX] = useState(() => getSavedOffset("X"));
  const [offsetY, setOffsetY] = useState(() => getSavedOffset("Y"));
  const [printDensity, setPrintDensity] = useState(getSavedDensity);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

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

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  useEffect(() => {
    const timer = window.setTimeout(
      () => void connectPrinter({ silent: true }),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [connectPrinter]);

  const clearPreview = () => {
    setPreviewError("");
    setPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return "";
    });
  };

  const resetLookup = () => {
    setScanCode("");
    setLabelData(null);
    setReprintCount(0);
    clearPreview();
    window.setTimeout(() => scanInputRef.current?.focus(), 0);
  };

  const lookupLabel = async () => {
    const boxQr = scanCode.trim();
    if (!boxQr) {
      showAlert(
        "warning",
        t("general_title.warning", "Warning"),
        t("reprint.scan_required", "Scan the Box Label QR first."),
      );
      return;
    }

    setIsLookingUp(true);
    clearPreview();
    try {
      const response = await lookupReprintLabel(boxQr, printDensity);
      const result = response.data?.data;
      setLabelData(result?.record || null);
      setReprintCount(Number(result?.reprintCount || 0));
    } catch (error) {
      setLabelData(null);
      setReprintCount(0);
      showAlert(
        "error",
        t("general_title.error", "Error"),
        error.response?.data?.message ||
          t("reprint.lookup_failed", "Unable to find the Box Label."),
      );
    } finally {
      setIsLookingUp(false);
    }
  };

  const saveOffsets = () => {
    localStorage.setItem("boxLabelOffsetX", String(offsetX));
    localStorage.setItem("boxLabelOffsetY", String(offsetY));
    localStorage.setItem("boxLabelDensity", printDensity);
    showAlert(
      "success",
      t("general_title.success", "Success"),
      t("box_label.offset_saved", "Print position saved."),
    );
  };

  const previewLabel = async () => {
    if (!labelData) return;
    setIsPreviewLoading(true);
    setPreviewError("");
    try {
      const zpl = buildBoxLabelZpl(
        labelData.ZPLCODE,
        labelData,
        offsetX,
        offsetY,
      );
      const response = await fetch(
        `https://api.labelary.com/v1/printers/${printDensity === "203DPI" ? 8 : 12}dpmm/labels/2.6772x1.5748/0/`,
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

  const reprintLabel = async () => {
    if (!labelData) return;
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

    setIsPrinting(true);
    let printCompleted = false;
    try {
      const zpl = buildBoxLabelZpl(
        labelData.ZPLCODE,
        labelData,
        offsetX,
        offsetY,
      );
      await sendZplCode(zpl);
      printCompleted = true;
      await logReprint(labelData.BOXLABEL_QR);

      showAlert(
        "success",
        t("general_title.success", "Success"),
        t("reprint.success", "Box Label reprinted successfully."),
      );
      resetLookup();
    } catch (error) {
      showAlert(
        "error",
        t("general_title.error", "Error"),
        printCompleted
          ? t(
              "reprint.log_failed",
              "The label was printed, but reprint history could not be saved.",
            )
          : error.response?.data?.message || error.message,
      );
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <TbRotateClockwise2 size={19} />
            <span>{t("reprint.title", "Reprint Box Label")}</span>
          </div>
          <CustomButton
            className={styles.headerIconButton}
            type="default"
            icon={<TbRefresh size={18} />}
            onClick={resetLookup}
            title={t("reprint.scan_another", "Scan another label")}
            aria-label={t("reprint.scan_another", "Scan another label")}
          />
        </header>

        <div className={styles.informationBody}>
          <div className={styles.scanRow}>
            <CustomInput
              ref={scanInputRef}
              label={t("reprint.scan_qr", "Scan Box QR")}
              required
              value={scanCode}
              onChange={(event) => setScanCode(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (!labelData) void lookupLabel();
                }
              }}
              disabled={Boolean(labelData) || isLookingUp}
              maxLength={26}
              labelWidth="130px"
            />
            <CustomButton
              type="primary"
              icon={<TbRefresh size={17} />}
              onClick={() => void lookupLabel()}
              disabled={!scanCode.trim() || Boolean(labelData) || isLookingUp}
            >
              {isLookingUp
                ? t("reprint.searching", "Searching...")
                : t("reprint.search", "Search")}
            </CustomButton>
          </div>

          {labelData && (
            <>
              {reprintCount > 0 && (
                <div className={styles.reprintNotice}>
                  {t("reprint.previous_count", "Previous reprints")}: {reprintCount}
                </div>
              )}
              <div className={styles.detailsGrid}>
                <CustomInput label={t("box_label.model", "Model")} value={labelData.MODELID || ""} disabled labelWidth="135px" />
                <CustomInput label={t("box_label.lot_no", "Lot No.")} value={labelData.LOTNO || ""} disabled labelWidth="135px" />
                <CustomInput label={t("box_label.materials_code", "Materials Code")} value={labelData.MATERIALSCODE || ""} disabled labelWidth="135px" />
                <CustomInput label={t("box_label.product", "Product")} value={labelData.PRODUCT || ""} disabled labelWidth="135px" />
                <CustomInput label={t("box_label.supplier", "Supplier")} value={labelData.SUPPLIER || ""} disabled labelWidth="135px" />
                <CustomInput label={t("box_label.production_factory", "Production Factory")} value={labelData.PRODUCTFACTORY || ""} disabled labelWidth="135px" />
                <CustomInput label={t("box_label.quantity", "Quantity")} value={labelData.QUANTITY ?? ""} disabled labelWidth="135px" />
                <CustomInput label={t("box_label.expiration_date", "Expiration date")} value={String(labelData.EXPIRATIONDATE || "").slice(0, 10)} disabled labelWidth="135px" />
                <CustomInput label={t("box_label.remarks", "Remarks")} value={labelData.REMARKS || ""} disabled labelWidth="135px" />
              </div>
            </>
          )}
        </div>

        <footer className={styles.leftFooter}>
          <CustomButton
            className={styles.reprintButton}
            type="primary"
            icon={<TbPrinter size={19} />}
            onClick={() => void reprintLabel()}
            disabled={!labelData || !printerName || isPrinting}
          >
            {isPrinting
              ? t("reprint.printing", "Printing...")
              : t("reprint.button", "Reprint")}
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
                <strong>{printerName || t("box_label.printer_not_found", "Printer not found")}</strong>
                <small>{printerName ? t("box_label.online", "Online") : t("box_label.offline", "Offline / Not Found")}</small>
              </span>
              <TbRefresh className={styles.refreshIcon} size={19} />
            </CustomButton>

            <div className={styles.offsetControls}>
              <label>
                {t("box_label.dpi", "DPI")}
                <select
                  value={printDensity}
                  onChange={(event) => {
                    setPrintDensity(event.target.value);
                    clearPreview();
                  }}
                  disabled={Boolean(labelData) || isPrinting}
                >
                  <option value="203DPI">203 DPI</option>
                  <option value="300DPI">300 DPI</option>
                </select>
              </label>
              <label>X<input type="number" value={offsetX} onChange={(event) => setOffsetX(Number(event.target.value))} /></label>
              <label>Y<input type="number" value={offsetY} onChange={(event) => setOffsetY(Number(event.target.value))} /></label>
              <CustomButton className={styles.saveButton} type="create" icon={<TbDeviceFloppy size={17} />} onClick={saveOffsets}>
                {t("box_label.save", "Save")}
              </CustomButton>
            </div>
          </div>

          <div className={styles.previewArea}>
            {isPreviewLoading ? (
              <div className={styles.previewPlaceholder}>{t("box_label.preview_loading", "Loading preview...")}</div>
            ) : previewUrl && !previewError ? (
              <img src={previewUrl} alt="Box Label Preview" className={styles.previewImage} />
            ) : (
              <div className={styles.previewPlaceholder}>
                <TbPhoto size={44} />
                <span>{previewError || t("box_label.preview_hint", "Click Preview to see label")}</span>
              </div>
            )}
          </div>
        </div>

        <footer className={styles.previewFooter}>
          <CustomButton
            className={styles.previewButton}
            type="default"
            icon={<TbPhoto size={17} />}
            onClick={() => void previewLabel()}
            disabled={!labelData || isPreviewLoading}
          >
            {t("box_label.preview", "Preview")}
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
