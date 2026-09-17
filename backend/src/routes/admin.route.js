import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  requireAnyPermission,
  requirePermission,
} from "../middlewares/authorization.middleware.js";
import {
  createUser,
  deleteUser,
  getAllUsers,
  updateUser,
  changeUserPassword,
} from "../controllers/admin/userSpec.controller.js";
import { getAllRoles, createRole, updateRole, deleteRole } from "../controllers/admin/role.controller.js";
import { updateRolePermission } from "../controllers/admin/mapping.controller.js";
import {
  getAllTranslations,
  updateTranslation,
  importTranslations,
} from "../controllers/admin/translation.controller.js";
import {
  getAllFactories,
  createFactory,
  updateFactory,
  deleteFactory,
} from "../controllers/admin/factory.controller.js";
import {
  getAllDepartments,
  getDepartmentsByFactory,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../controllers/admin/department.controller.js";
import {
  getAllModels,
  createModel,
  updateModel,
  deleteModel,
} from "../controllers/admin/modelSpec.controller.js";
import {
  getAllZplSpecs,
  getZplSpecByType,
  updateZplSpec,
} from "../controllers/admin/zplSpec.controller.js";

const router = express.Router();

//================ User =====================
router.get(
  "/admin/users",
  authMiddleware,
  requirePermission("ADMIN_USER"),
  getAllUsers,
);
router.post(
  "/admin/users",
  authMiddleware,
  requirePermission("ADMIN_USER"),
  createUser,
);
router.put(
  "/admin/users/:userId",
  authMiddleware,
  requirePermission("ADMIN_USER"),
  updateUser,
);
router.delete(
  "/admin/users/:userId",
  authMiddleware,
  requirePermission("ADMIN_USER"),
  deleteUser,
);
router.post(
  "/admin/users/:userId/change-password",
  authMiddleware,
  requirePermission("ADMIN_USER"),
  changeUserPassword,
);

//================ Role =====================
router.get(
  "/admin/roles",
  authMiddleware,
  requireAnyPermission("ADMIN_ROLE", "ADMIN_USER", "ADMIN_MAPPING"),
  getAllRoles,
);
router.post("/admin/roles", authMiddleware, requirePermission("ADMIN_ROLE"), createRole);
router.put("/admin/roles/:id", authMiddleware, requirePermission("ADMIN_ROLE"), updateRole);
router.delete("/admin/roles/:id", authMiddleware, requirePermission("ADMIN_ROLE"), deleteRole);

//================ Mapping =====================
router.put("/admin/mapping/:id", authMiddleware, requirePermission("ADMIN_MAPPING"), updateRolePermission);

//================ Translation =====================
router.get("/admin/translations", authMiddleware, requirePermission("ADMIN_TRANSLATION"), getAllTranslations);
router.put("/admin/translations/:id", authMiddleware, requirePermission("ADMIN_TRANSLATION"), updateTranslation);
router.post("/admin/translations/import", authMiddleware, requirePermission("ADMIN_TRANSLATION"), importTranslations);

//================ Factory =====================
router.get(
  "/admin/factories",
  authMiddleware,
  requireAnyPermission("ADMIN_FACTORY", "ADMIN_DEPARTMENT", "ADMIN_USER", "ADMIN_MODEL"),
  getAllFactories,
);
router.post("/admin/factories", authMiddleware, requirePermission("ADMIN_FACTORY"), createFactory);
router.put("/admin/factories/:id", authMiddleware, requirePermission("ADMIN_FACTORY"), updateFactory);
router.delete("/admin/factories/:id", authMiddleware, requirePermission("ADMIN_FACTORY"), deleteFactory);

//================ Department =====================
router.get(
  "/admin/departments",
  authMiddleware,
  requireAnyPermission("ADMIN_DEPARTMENT", "ADMIN_USER"),
  getAllDepartments,
);
router.get(
  "/admin/departments/factory/:factoryId",
  authMiddleware,
  requireAnyPermission("ADMIN_DEPARTMENT", "ADMIN_USER"),
  getDepartmentsByFactory,
);
router.post("/admin/departments", authMiddleware, requirePermission("ADMIN_DEPARTMENT"), createDepartment);
router.put("/admin/departments/:id", authMiddleware, requirePermission("ADMIN_DEPARTMENT"), updateDepartment);
router.delete("/admin/departments/:id", authMiddleware, requirePermission("ADMIN_DEPARTMENT"), deleteDepartment);

//================ Model Spec =====================
router.get("/admin/models", authMiddleware, requirePermission("ADMIN_MODEL"), getAllModels);
router.post("/admin/models", authMiddleware, requirePermission("ADMIN_MODEL"), createModel);
router.put("/admin/models/:id", authMiddleware, requirePermission("ADMIN_MODEL"), updateModel);
router.delete("/admin/models/:id", authMiddleware, requirePermission("ADMIN_MODEL"), deleteModel);

//================ ZPL Spec =====================
router.get("/admin/zpls", authMiddleware, requirePermission("ADMIN_ZPL"), getAllZplSpecs);
router.get("/admin/zpls/type/:type", authMiddleware, requirePermission("ADMIN_ZPL"), getZplSpecByType);
router.put("/admin/zpls/:id", authMiddleware, requirePermission("ADMIN_ZPL"), updateZplSpec);

export default router;
