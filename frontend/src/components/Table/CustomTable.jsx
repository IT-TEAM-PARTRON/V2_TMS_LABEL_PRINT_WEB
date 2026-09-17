import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styles from "./CustomTable.module.css";

// Số dòng/trang mặc định khi bật pagination client-side mà không truyền pageSize cụ thể.
const DEFAULT_CLIENT_PAGE_SIZE = 300;

function CustomTable({
  columns = [],
  data = [],
  maxHeight = "400px", // Tăng một chút cho màn hình xưởng
  rowKey = "id",
  emptyText,
  onRowClick,        // Bổ sung sự kiện click dòng
  activeRowId = null, // ID của dòng đang được chọn
  enableSort = false,   // Opt-in: bật sort theo cột khi click header (chỉ dùng ở trang cần)
  enableResize = false, // Opt-in: bật kéo giãn độ rộng cột
  legacy = false,       // Opt-in: giữ giao diện gốc trước redesign (VD: trang History chưa yêu cầu đổi UI)
  autoFitColumns = true, // Opt-out: truyền false để cột tự co giãn theo nội dung, không ép width mặc định (VD: bảng có dữ liệu ngắn, không cần ellipsis)
  // Opt-in: bật phân trang. Truyền `false`/bỏ qua để giữ nguyên hành vi cũ (không phân trang).
  // Truyền `true` hoặc { pageSize } để tự phân trang phía client.
  // Truyền kèm `onPageChange` để chuyển sang chế độ phân trang server-side (data truyền vào là dữ liệu của đúng trang hiện tại).
  pagination = false,
  onPageChange,
  tableWidth, // Thêm prop này để người dùng có thể truyền vào
}) {
  const { t } = useTranslation();

  // --- SORTING STATE ---
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // --- RESIZING STATE ---
  const [colWidths, setColWidths] = useState({});

  // --- SORT LOGIC ---
  const handleSort = (key) => {
    if (!enableSort) return;
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!enableSort || !sortConfig.key) return data;
    const sortableItems = [...data];
    sortableItems.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sortableItems;
  }, [data, sortConfig, enableSort]);

  // --- PAGINATION LOGIC ---
  const isPaginationEnabled = !!pagination;
  const isServerPaginated = isPaginationEnabled && typeof onPageChange === "function";
  const paginationConfig = typeof pagination === "object" && pagination !== null ? pagination : {};

  const wrapperRef = useRef(null);
  const pageSize = paginationConfig.pageSize || DEFAULT_CLIENT_PAGE_SIZE;

  const [internalPage, setInternalPage] = useState(1);
  const currentPage = isServerPaginated ? (paginationConfig.current || 1) : internalPage;

  useEffect(() => {
    if (isPaginationEnabled && !isServerPaginated) {
      const resetTimer = setTimeout(() => setInternalPage(1), 0);
      return () => clearTimeout(resetTimer);
    }
  }, [data, isPaginationEnabled, isServerPaginated]);

  const totalRecords = isServerPaginated
    ? (paginationConfig.total ?? sortedData.length)
    : sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  const pagedData = useMemo(() => {
    if (!isPaginationEnabled || isServerPaginated) return sortedData;
    const start = (internalPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, isPaginationEnabled, isServerPaginated, internalPage, pageSize]);

  const pageOffset = isPaginationEnabled && !isServerPaginated ? (currentPage - 1) * pageSize : 0;

  const handlePageChange = (page) => {
    const target = Math.min(Math.max(1, page), totalPages);
    if (target === currentPage) return;
    if (isServerPaginated) {
      onPageChange(target);
    } else {
      setInternalPage(target);
    }
  };

  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = totalRecords === 0 ? 0 : Math.min(currentPage * pageSize, totalRecords);

  // --- RESIZE LOGIC ---
  const resizeRef = useRef({ colKey: null, startX: 0, startWidth: 0 });

  const handleMouseDown = useCallback((e, colKey, colPropWidth) => {
    if (!enableResize) return;
    e.stopPropagation(); // Ngăn sự kiện click lan ra th để không bị sort
    e.preventDefault();  // Ngăn focus và bôi đen chữ khi kéo chuột

    let currentWidth = 100;
    if (colWidths[colKey]) {
      currentWidth = colWidths[colKey];
    } else if (colPropWidth) {
      currentWidth = typeof colPropWidth === "number" ? colPropWidth : parseInt(colPropWidth, 10) || 100;
    }

    resizeRef.current = { colKey, startX: e.clientX, startWidth: currentWidth };

    const onMouseMove = (moveEvent) => {
      const { colKey: activeKey, startX, startWidth } = resizeRef.current;
      if (!activeKey) return;
      const newWidth = Math.max(20, startWidth + (moveEvent.clientX - startX)); // Min width 20px
      setColWidths((prev) => ({ ...prev, [activeKey]: newWidth }));
    };

    const onMouseUp = () => {
      resizeRef.current = { colKey: null, startX: 0, startWidth: 0 };
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "default";
      document.body.style.userSelect = ""; // Khôi phục lại trạng thái bôi đen bình thường
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none"; // Ngăn bôi đen toàn trang trong lúc đang kéo
  }, [colWidths, enableResize]);

  // Luôn ép cột về một width cụ thể (mặc định 100px nếu cột không khai báo width),
  // kể cả khi không bật enableResize, để tránh bảng bị giãn theo nội dung dài (dùng ellipsis thay vì scroll ngang).
  const getColWidth = useCallback((col) => {
    if (legacy) return col.width; // Giữ nguyên hành vi cũ cho giao diện legacy (VD: trang History)
    if (!autoFitColumns) return enableResize ? (colWidths[col.key] || col.width) : col.width; // Không ép width mặc định, cột tự co theo nội dung
    return colWidths[col.key] || col.width || (enableResize ? 100 : undefined);
  }, [legacy, autoFitColumns, enableResize, colWidths]);

  return (
    <div className={styles.tableRoot}>
      <div
        ref={wrapperRef}
        className={`
          ${styles.tableWrapper}
          ${legacy ? styles.tableWrapperLegacy : ""}
          ${legacy && isPaginationEnabled ? styles.tableWrapperLegacyWithPagination : ""}
          ${pagedData.length === 0 ? styles.tableWrapperEmpty : ""}
        `}
        style={{ maxHeight }}
      >
      <table 
        className={`${styles.table} ${legacy ? styles.tableLegacy : ""} ${!legacy && pagedData.length === 0 ? styles.tableEmpty : ""}`}
        style={tableWidth ? { width: tableWidth } : {}}
      >
        {/* HEADER */}
        <thead className={`${styles.thead} ${legacy ? styles.theadLegacy : ""}`}>
          <tr>
            {columns.map((col) => {
              const isFixedLeft = col.fixed === "left";
              const isFixedRight = col.fixed === "right";

              const colWidth = getColWidth(col);

              const sortKey = col.dataIndex || col.key;
              const isSorted = enableSort && sortConfig.key === sortKey;

              return (
                <th
                  key={col.key}
                  style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                  className={`
                    ${styles.th}
                    ${legacy ? styles.thLegacy : ""}
                    ${enableSort ? styles.thSortable : ""}
                    ${isFixedLeft ? styles.stickyLeft : ""}
                    ${isFixedRight ? styles.stickyRight : ""}
                  `}
                  onClick={() => handleSort(sortKey)}
                >
                  {enableSort || enableResize ? (
                    <div className={styles.thContent}>
                      <span className={styles.thText} title={col.title}>{col.title}</span>
                      {isSorted && (
                        <span className={styles.sortIcons}>
                          <span className={sortConfig.direction === "asc" ? styles.sortActive : styles.sortInactive}>▲</span>
                          <span className={sortConfig.direction === "desc" ? styles.sortActive : styles.sortInactive}>▼</span>
                        </span>
                      )}
                    </div>
                  ) : (
                    col.title
                  )}

                  {enableResize && (
                    <div
                      className={styles.resizer}
                      onMouseDown={(e) => handleMouseDown(e, col.key, col.width)}
                      onClick={(e) => e.stopPropagation()} // Ngăn click vào resizer làm sort
                    />
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        {/* BODY */}
        {pagedData.length > 0 && (
          <tbody>
            {pagedData.map((row, idxInPage) => {
              const idx = idxInPage + pageOffset;
              const isPlaceholder = row.isPlaceholder;
              const rowId = row[rowKey] || idx;
              const isActive = rowId === activeRowId;

              return (
                <tr
                  key={rowId}
                  onClick={() => !isPlaceholder && onRowClick && onRowClick(row)}
                  className={`
                    ${styles.tr}
                    ${!isPlaceholder ? styles.trHover : ""}
                    ${!isPlaceholder && legacy ? styles.trHoverLegacy : ""}
                    ${isActive ? styles.trActive : getRowBg(row)}
                    ${isActive && legacy ? styles.trActiveLegacy : ""}
                    ${onRowClick && !isPlaceholder ? styles.trClickable : ""}
                  `}
                >
                  {columns.map((col) => {
                    const isFixedLeft = col.fixed === "left";
                    const isFixedRight = col.fixed === "right";
                    const colWidth = getColWidth(col);

                    return (
                      <td
                        key={col.key}
                        style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                        className={`
                          ${styles.td}
                          ${legacy ? styles.tdLegacy : ""}
                          ${getAlign(col.align)}
                          ${isPlaceholder ? styles.tdPlaceholder : resolveClassName(col.className, row, idx)}
                          ${isFixedLeft ? styles.stickyLeft : ""}
                          ${isFixedRight ? styles.stickyRight : ""}
                        `}
                      >
                        {isPlaceholder
                          ? "—"
                          : col.render
                            ? col.render(row, idx)
                            : row[col.dataIndex]}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        )}
      </table>

      {pagedData.length === 0 && (
        <div className={styles.emptyState}>{emptyText || t("table.empty")}</div>
      )}
      </div>

      {isPaginationEnabled && (
        <div className={`${styles.paginationBar} ${legacy ? styles.paginationBarLegacy : ""}`}>
          <span className={styles.paginationInfo}>
            {t("table.showing")} {startRecord} - {endRecord} {t("table.of")} {totalRecords}
          </span>
          <div className={styles.paginationControls}>
            <button
              type="button"
              className={styles.paginationBtn}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              {t("table.pagination.previous")}
            </button>
            <span className={styles.paginationPage}>{currentPage} / {totalPages}</span>
            <button
              type="button"
              className={styles.paginationBtn}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              {t("table.pagination.next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomTable;

/* ── Helpers ── */
function getAlign(align) {
  switch (align) {
    case "left":   return styles.alignLeft;   // Khi người dùng khai báo align: "left"
    case "right":  return styles.alignRight;  // Khi người dùng khai báo align: "right"
    case "center": return styles.alignCenter;
    default:       return styles.alignCenter; // 👈 ĐỔI MẶC ĐỊNH THÀNH CĂN GIỮA
  }
}

function getRowBg(row) {
  if (row.isNew)   return styles.trNew;
  if (row.isError) return styles.trError;
  return styles.trWhite;
}

function resolveClassName(className, row, idx) {
  if (typeof className === "function") return className(row, idx);
  return className || "";
}
