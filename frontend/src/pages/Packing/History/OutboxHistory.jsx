import { useRef, useState } from "react";
import { TbHistory, TbListDetails, TbRefresh, TbSearch } from "react-icons/tb";
import { useTranslation } from "react-i18next";
import { searchPackingHistory } from "../../../api/packing/historyApi.js";
import CustomButton from "../../../components/Button/CustomButton.jsx";
import CustomDatePicker from "../../../components/DatePicker/DatePicker.jsx";
import CustomInput from "../../../components/Input/CustomInput.jsx";
import CustomAlertModal from "../../../components/Modal/CustomAlertModal.jsx";
import CustomSection from "../../../components/Section/CustomSection.jsx";
import CustomTable from "../../../components/Table/CustomTable.jsx";
import { formatDateISO } from "../../../utils/dateTime.js";
import styles from "./OutboxHistory.module.css";

const PAGE_SIZE = 50;

const createDefaultFilters = () => ({
  boxQr: "",
  dateFrom: null,
  dateTo: null,
});

const displayDate = (value) => (value ? String(value).slice(0, 10) : "-");
const displayDateTime = (value) =>
  value ? String(value).replace("T", " ").slice(0, 19) : "-";

export default function OutboxHistory() {
  const { t } = useTranslation();
  const qrInputRef = useRef(null);
  const [filters, setFilters] = useState(createDefaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "error",
    title: "",
    message: "",
  });

  const showError = (message) =>
    setAlertModal({
      isOpen: true,
      type: "error",
      title: t("general_title.error", "Error"),
      message,
    });

  const buildParams = (value, currentPage) => ({
    boxQr: value.boxQr.trim() || undefined,
    dateFrom: value.dateFrom ? formatDateISO(value.dateFrom) : undefined,
    dateTo: value.dateTo ? formatDateISO(value.dateTo) : undefined,
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  const fetchHistory = async (value, currentPage) => {
    setIsLoading(true);
    try {
      const response = await searchPackingHistory(
        buildParams(value, currentPage),
      );
      setRows(Array.isArray(response.data?.data) ? response.data.data : []);
      setTotal(Number(response.data?.meta?.total || 0));
    } catch (error) {
      setRows([]);
      setTotal(0);
      showError(
        error.response?.data?.message ||
          t("packing_history.search_failed"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    const nextFilters = {
      ...filters,
      boxQr: filters.boxQr.trim(),
    };
    const hasStartDate = Boolean(nextFilters.dateFrom);
    const hasEndDate = Boolean(nextFilters.dateTo);

    if (!nextFilters.boxQr && !hasStartDate && !hasEndDate) {
      showError(t("packing_history.search_condition_required"));
      return;
    }
    if (hasStartDate !== hasEndDate) {
      showError(t("packing_history.complete_date_range"));
      return;
    }
    if (
      hasStartDate &&
      nextFilters.dateFrom.getTime() > nextFilters.dateTo.getTime()
    ) {
      showError(t("packing_history.invalid_date_range"));
      return;
    }

    setAppliedFilters(nextFilters);
    setPage(1);
    void fetchHistory(nextFilters, 1);
  };

  const handleReset = () => {
    setFilters(createDefaultFilters());
    setAppliedFilters(null);
    setRows([]);
    setPage(1);
    setTotal(0);
    window.setTimeout(() => qrInputRef.current?.focus(), 0);
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    if (appliedFilters) void fetchHistory(appliedFilters, nextPage);
  };

  const columns = [
    {
      key: "no",
      title: t("table.no"),
      width: 58,
      align: "center",
      render: (_row, index) => index + 1 + (page - 1) * PAGE_SIZE,
    },
    {
      key: "BOXLABEL_QR",
      dataIndex: "BOXLABEL_QR",
      title: t("packing_history.col_box_qr"),
      width: 220,
      align: "left",
    },
    {
      key: "MODELID",
      dataIndex: "MODELID",
      title: t("packing_history.col_model"),
      width: 130,
    },
    {
      key: "LOTNO",
      dataIndex: "LOTNO",
      title: t("packing_history.col_lot_no"),
      width: 130,
    },
    {
      key: "QUANTITY",
      dataIndex: "QUANTITY",
      title: t("packing_history.col_quantity"),
      width: 100,
      align: "right",
    },
    {
      key: "EXPIRATIONDATE",
      dataIndex: "EXPIRATIONDATE",
      title: t("packing_history.col_expiration_date"),
      width: 145,
      render: (row) => displayDate(row.EXPIRATIONDATE),
    },
    {
      key: "REMARKS",
      dataIndex: "REMARKS",
      title: t("packing_history.col_remarks"),
      width: 220,
      align: "left",
      render: (row) => row.REMARKS || "-",
    },
    {
      key: "EVENTUSER",
      dataIndex: "EVENTUSER",
      title: t("packing_history.col_event_user"),
      width: 130,
    },
    {
      key: "EVENTTIME",
      dataIndex: "EVENTTIME",
      title: t("packing_history.col_event_time"),
      width: 170,
      render: (row) => displayDateTime(row.EVENTTIME),
    },
  ];

  return (
    <div className={styles.page}>
      <CustomSection
        className={styles.filterSection}
        title={
          <div className={styles.title}>
            <TbHistory size={20} />
            {t("packing_history.title")}
          </div>
        }
      >
        <div className={styles.filters}>
          <CustomInput
            ref={qrInputRef}
            label={t("packing_history.box_qr")}
            value={filters.boxQr}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                boxQr: event.target.value,
              }))
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSearch();
              }
            }}
            maxLength={26}
            width="440px"
            labelWidth="82px"
            autoFocus
          />

          <CustomDatePicker
            label={t("packing_history.date_range")}
            selectsRange
            startDate={filters.dateFrom}
            endDate={filters.dateTo}
            onChange={([dateFrom, dateTo]) =>
              setFilters((current) => ({
                ...current,
                dateFrom,
                dateTo,
              }))
            }
            dateFormat="yyyy-MM-dd"
            placeholderText={t("packing_history.date_placeholder")}
            width="350px"
            labelWidth="90px"
            isClearable
          />

          <div className={styles.actions}>
            <CustomButton
              type="default"
              icon={<TbRefresh />}
              onClick={handleReset}
              disabled={isLoading}
            >
              {t("packing_history.reset")}
            </CustomButton>
            <CustomButton
              type="primary"
              icon={<TbSearch />}
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading
                ? t("packing_history.searching")
                : t("packing_history.search")}
            </CustomButton>
          </div>
        </div>
      </CustomSection>

      <CustomSection
        className={styles.tableSection}
        title={
          <div className={styles.title}>
            <TbListDetails size={20} />
            {t("packing_history.list_title")}
          </div>
        }
        badge={
          appliedFilters
            ? `${total} ${t("packing_history.records")}`
            : undefined
        }
      >
        <CustomTable
          columns={columns}
          data={rows}
          rowKey="ID"
          maxHeight="none"
          enableResize
          enableSort
          emptyText={
            isLoading
              ? t("packing_history.loading")
              : t("packing_history.empty")
          }
          pagination={{ current: page, pageSize: PAGE_SIZE, total }}
          onPageChange={handlePageChange}
        />
      </CustomSection>

      <CustomAlertModal
        {...alertModal}
        onClose={() =>
          setAlertModal((current) => ({ ...current, isOpen: false }))
        }
      />
    </div>
  );
}
