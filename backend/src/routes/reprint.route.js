import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/authorization.middleware.js";
import {
  logBoxLabelReprint,
  lookupBoxLabelReprint,
} from "../controllers/packing/reprint.controller.js";

const router = express.Router();

router.post(
  "/packing/reprint/lookup",
  authMiddleware,
  requirePermission("PACKING_REPRINT"),
  lookupBoxLabelReprint,
);

router.post(
  "/packing/reprint/log",
  authMiddleware,
  requirePermission("PACKING_REPRINT"),
  logBoxLabelReprint,
);

export default router;
