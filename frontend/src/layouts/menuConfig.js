import { IoSettingsOutline, IoDocumentTextOutline } from "react-icons/io5";
import { IoPeopleOutline } from "react-icons/io5";

/**
 * Cấu hình Menu tập trung cho hệ thống Approval Management
 * - key: Quyền tương ứng trong Database (Permissions)
 * - titleKey: Key i18n để dịch đa ngôn ngữ
 * - icon: Component Icon (chỉ dùng cho Menu cha hoặc Menu đơn)
 * - path: Đường dẫn Route
 * - items: Danh sách menu con (nếu có)
 * Lưu ý: menu cha sẽ có key kết thúc bằng "_GRP" để dễ dàng phân biệt và xử lý trong Sidebar.jsx
 */
export const MENU_CONFIG = [
  {
    key: "PACKING_GRP",
    titleKey: "sidebar.packing",
    titleFallback: "Packing",
    icon: IoDocumentTextOutline,
    path: "/packing",
    items: [
      {
        key: "PACKING_BOXLABEL",
        titleKey: "sidebar.box_label",
        titleFallback: "BoxLabel",
        path: "/packing/box-label",
      },
      {
        key: "PACKING_REPRINT",
        titleKey: "sidebar.reprint",
        titleFallback: "Reprint",
        path: "/packing/reprint",
      },
      {
        key: "PACKING_HISTORY",
        titleKey: "sidebar.history",
        titleFallback: "History",
        path: "/packing/history",
      },
    ],
  },
  {
    key: "ADMIN_GRP",
    titleKey: "sidebar.admin",
    icon: IoSettingsOutline,
    path: "/admin",
    items: [
      {
        key: "ADMIN_GENERAL_INFO",
        titleKey: "sidebar.general_info",
        items: [
          {
            key: "ADMIN_FACTORY",
            titleKey: "sidebar.admin_factory",
            path: "/admin/factories",
          },
          {
            key: "ADMIN_DEPARTMENT",
            titleKey: "sidebar.admin_department",
            path: "/admin/departments",
          },
          {
            key: "ADMIN_ROLE",
            titleKey: "sidebar.admin_roles",
            path: "/admin/roles",
          },
          {
            key: "ADMIN_USER",
            titleKey: "sidebar.admin_users",
            path: "/admin/users",
          },
          {
            key: "ADMIN_MAPPING",
            titleKey: "sidebar.admin_mapping",
            path: "/admin/mapping",
          },
          {
            key: "ADMIN_TRANSLATION",
            titleKey: "sidebar.admin_translation",
            path: "/admin/translations",
          },
        ],
      },
      {
        key: "ADMIN_STANDARD_INFO",
        titleKey: "sidebar.standard_info",
        titleFallback: "Standard Info",
        items: [
          {
            key: "ADMIN_MODEL",
            titleKey: "sidebar.admin_model",
            titleFallback: "Model Spec",
            path: "/admin/models",
          },
          {
            key: "ADMIN_ZPL",
            titleKey: "sidebar.admin_zpl",
            titleFallback: "ZPL Spec",
            path: "/admin/zpls",
          },
        ],
      }
    ],
  },

];
