import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/authorization.middleware.js";
import { searchPackingHistory } from "../controllers/packing/history.controller.js";

const router = express.Router();

router.get(
  "/packing/history",
  authMiddleware,
  requirePermission("PACKING_HISTORY"),
  searchPackingHistory,
);

export default router;
