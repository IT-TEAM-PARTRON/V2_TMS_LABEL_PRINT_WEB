import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/authorization.middleware.js";
import {
  createBoxLabel,
  getBoxLabelModels,
  getBoxLabelTemplate,
} from "../controllers/packing/outbox.controller.js";

const router = express.Router();

router.get(
  "/packing/box-label/models",
  authMiddleware,
  requirePermission("PACKING_BOXLABEL"),
  getBoxLabelModels,
);
router.get(
  "/packing/box-label/template/:type",
  authMiddleware,
  requirePermission("PACKING_BOXLABEL"),
  getBoxLabelTemplate,
);
router.post(
  "/packing/box-label",
  authMiddleware,
  requirePermission("PACKING_BOXLABEL"),
  createBoxLabel,
);

export default router;
