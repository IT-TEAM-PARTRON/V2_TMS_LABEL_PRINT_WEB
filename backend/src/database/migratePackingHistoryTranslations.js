import db from "../config/db.js";

const translations = [
  ["title", "Packing History", "Lịch sử đóng gói", "포장 이력"],
  ["box_qr", "Box QR", "QR thùng", "박스 QR"],
  ["date_range", "Date", "Ngày", "날짜"],
  ["date_placeholder", "Select date range", "Chọn khoảng ngày", "날짜 범위를 선택하세요"],
  ["reset", "Reset", "Đặt lại", "초기화"],
  ["search", "Search", "Tìm kiếm", "검색"],
  ["searching", "Searching...", "Đang tìm kiếm...", "검색 중..."],
  ["list_title", "Packing History List", "Danh sách lịch sử đóng gói", "포장 이력 목록"],
  ["records", "records", "bản ghi", "건"],
  ["loading", "Loading...", "Đang tải...", "불러오는 중..."],
  ["empty", "No packing history found.", "Không có lịch sử đóng gói.", "포장 이력이 없습니다."],
  ["search_failed", "Unable to search packing history.", "Không thể truy xuất lịch sử đóng gói.", "포장 이력을 조회하지 못했습니다."],
  ["search_condition_required", "Enter a Box QR or select a date range.", "Hãy nhập QR thùng hoặc chọn khoảng ngày.", "박스 QR을 입력하거나 날짜 범위를 선택하세요."],
  ["complete_date_range", "Select both the start date and end date.", "Hãy chọn đầy đủ ngày bắt đầu và ngày kết thúc.", "시작일과 종료일을 모두 선택하세요."],
  ["invalid_date_range", "The start date cannot be later than the end date.", "Ngày bắt đầu không được lớn hơn ngày kết thúc.", "시작일은 종료일보다 늦을 수 없습니다."],
  ["col_box_qr", "Box QR", "QR thùng", "박스 QR"],
  ["col_model", "Model", "Model", "모델"],
  ["col_lot_no", "Lot No.", "Số Lot", "로트 번호"],
  ["col_quantity", "Quantity", "Số lượng", "수량"],
  ["col_expiration_date", "Expiration Date", "Ngày hết hạn", "유효기간"],
  ["col_remarks", "Remarks", "Ghi chú", "비고"],
  ["col_event_user", "Event User", "Người thao tác", "작업자"],
  ["col_event_time", "Event Time", "Thời gian thao tác", "작업 시간"],
].map(([name, EN, VI, KR], index) => ({
  ID: `PACKHIST_${String(index + 1).padStart(3, "0")}`,
  DESCRIPTION: `packing_history.${name}`,
  EN,
  VI,
  KR,
}));

let connection;

try {
  connection = await db.getConnection();
  await connection.beginTransaction();
  await connection.batch(
    `INSERT INTO TRANSLATIONS
      (ID, EN, VI, KR, DESCRIPTION, EVENTUSER)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       EN = VALUES(EN),
       VI = VALUES(VI),
       KR = VALUES(KR),
       EVENTUSER = VALUES(EVENTUSER)`,
    translations.map((item) => [
      item.ID,
      item.EN,
      item.VI,
      item.KR,
      item.DESCRIPTION,
      "SYSTEM",
    ]),
  );
  await connection.commit();
  const countRows = await connection.query(
    "SELECT COUNT(*) AS TOTAL FROM TRANSLATIONS WHERE DESCRIPTION LIKE 'packing_history.%'",
  );
  console.log(
    `Synchronized ${translations.length} packing history translations; database contains ${Number(countRows[0].TOTAL)} keys.`,
  );
} catch (error) {
  if (connection) await connection.rollback();
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (connection) connection.release();
  await db.end();
}
