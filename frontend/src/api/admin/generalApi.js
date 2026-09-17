// src/api/admin/adminApi.js
import api from "../api.js";

//======================= User APIs =======================
// 1. Lấy danh sách toàn bộ người dùng
export const getAllUsers = () => {
  return api.get("/admin/users");
};

// 2. Thêm mới người dùng
export const createUser = (userData) => {
  return api.post("/admin/users", userData);
};

// 3. Cập nhật thông tin người dùng
export const updateUser = (id, userData) => {
  return api.put(`/admin/users/${id}`, userData);
};

// 4. Xóa người dùng
export const deleteUser = (id) => {
  return api.delete(`/admin/users/${id}`);
};

// 5. Đổi mật khẩu người dùng
export const changeUserPassword = ({ userId, newPassword }) => {
  return api.post(`/admin/users/${userId}/change-password`, { newPassword });
};

//======================= Role APIs =======================
export const getRoles = () => {
  return api.get("/admin/roles");
};

export const createRole = (roleData) => {
  return api.post("/admin/roles", roleData);
};

export const updateRole = (id, roleData) => {
  return api.put(`/admin/roles/${id}`, roleData);
};

export const deleteRole = (id) => {
  return api.delete(`/admin/roles/${id}`);
};

//======================= Mapping APIs =======================
export const updateRolePermission = (id, permissions) => {
  return api.put(`/admin/mapping/${id}`, { permissions });
};

//======================= Translation APIs =======================
export const getAllTranslations = () => {
  return api.get("/admin/translations");
};

export const updateTranslation = (id, data) => {
  return api.put(`/admin/translations/${id}`, data);
};

export const importTranslations = (data) => {
  return api.post("/admin/translations/import", { translations: data });
};

//======================= Factory APIs =======================
export const getAllFactories = () => {
  return api.get("/admin/factories");
};

export const createFactory = (factoryData) => {
  return api.post("/admin/factories", factoryData);
};

export const updateFactory = (id, factoryData) => {
  return api.put(`/admin/factories/${id}`, factoryData);
};

export const deleteFactory = (id) => {
  return api.delete(`/admin/factories/${id}`);
};

//======================= Department APIs =======================
export const getAllDepartments = () => {
  return api.get("/admin/departments");
};

export const getDepartmentsByFactory = (factoryId) => {
  return api.get(`/admin/departments/factory/${factoryId}`);
};

export const createDepartment = (deptData) => {
  return api.post("/admin/departments", deptData);
};

export const updateDepartment = (id, deptData) => {
  return api.put(`/admin/departments/${id}`, deptData);
};

export const deleteDepartment = (id) => {
  return api.delete(`/admin/departments/${id}`);
};


//======================= Data Spec APIs =======================
export const getDataSpecs = () => {
  return api.get("/admin/spec");
};

export const createDataSpec = (data) => {
  return api.post("/admin/spec", data);
};

export const updateDataSpec = (id, data) => {
  return api.put(`/admin/spec/${id}`, data);
};

export const deleteDataSpec = (id) => {
  return api.delete(`/admin/spec/${id}`);
};

export const importDataSpecs = (dataList) => {
  return api.post("/admin/spec/import", dataList);
};
