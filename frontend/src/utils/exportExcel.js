// 👇 1. ĐỔI IMPORT TỪ "xlsx" SANG "xlsx-js-style"
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { formatDateTime } from "./dateTime.js";

export const exportToExcel = (data, columns, fileName = "Export_Data") => {
  if (!data || data.length === 0) {
    alert("Không có dữ liệu để xuất!");
    return;
  }

  // 1. Format dữ liệu y như cũ
  const formattedData = data.map((row, index) => {
    let rowData = {};
    columns.forEach((col) => {
      if (col.key === "action") return;
      if (col.key === "no") {
        rowData[col.title] = index + 1;
        return;
      }
      if (col.render) {
        const renderContent = col.render(row, index);
        if (renderContent?.props?.children) {
             rowData[col.title] = renderContent.props.children;
        } else {
             rowData[col.title] = renderContent || "—";
        }
      } else {
        rowData[col.title] = row[col.dataIndex || col.key] || "—";
      }
    });
    return rowData;
  });

  // 2. Chuyển đổi JSON thành WorkSheet
  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // 👇 3. [THÊM MỚI] BẮT ĐẦU TÔ MÀU CHO HÀNG TIÊU ĐỀ
  // Lấy giới hạn của bảng (Ví dụ: từ A1 đến F100)
  const range = XLSX.utils.decode_range(worksheet['!ref']);

  // Vòng lặp duyệt qua tất cả các cột ở hàng đầu tiên (r: 0 có nghĩa là Row 1 trong Excel)
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C }); // Lấy tọa độ ô (A1, B1, C1...)

    if (!worksheet[cellAddress]) continue;

    // Ép Style cho ô đó
    worksheet[cellAddress].s = {
      fill: {
        // Màu nền: Phải thêm chữ "FF" ở trước mã HEX (ARGB)
        // Ví dụ: Màu #1e66ad thì viết thành "FF1e66ad"
        fgColor: { rgb: "FF1e66ad" }
      },
      font: {
        color: { rgb: "FFFFFFFF" }, // Màu chữ trắng
        bold: true,                 // In đậm
        name: "Arial",              // Đổi font chữ
        sz: 12                      // Kích thước chữ (Size)
      },
      alignment: {
        horizontal: "center",       // Căn giữa ngang
        vertical: "center"          // Căn giữa dọc
      },
      border: {
        // Thêm viền mỏng xung quanh ô tiêu đề
        top: { style: "thin", color: { auto: 1 } },
        bottom: { style: "thin", color: { auto: 1 } },
        left: { style: "thin", color: { auto: 1 } },
        right: { style: "thin", color: { auto: 1 } }
      }
    };
  }
  // 👆 KẾT THÚC PHẦN TÔ MÀU

  // 4. Chỉnh độ rộng cột tự động
  const wscols = columns
    .filter(col => col.key !== "action")
    .map((col) => ({ wch: Math.max(col.title.length + 5, 15) })); // Tăng thêm 5 đơn vị cho rộng rãi
  worksheet["!cols"] = wscols;

  // 5. Tạo WorkBook và lưu file
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  // Gọi hàm lấy giờ chuẩn: "2026-04-24 14:48:00"
  let timeStr = formatDateTime();

  // Biến dấu cách thành gạch dưới, biến dấu ":" thành "-" để tên file hợp lệ trên Windows
  // Kết quả: "2026-04-24_14-48-00"
  timeStr = timeStr.replace(/-/g, "").replace(/ /g, "_").replace(/:/g, "");

  // Lưu file với tên mới (Ví dụ: Bao_Cao_Rework_2026-04-24_14-48-00.xlsx)
  saveAs(blob, `${fileName}_${timeStr}.xlsx`);
};