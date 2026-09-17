import PackingHistoryModel from "../../models/packing/history.model.js";
import { fail, ok } from "../../middlewares/responseHandler.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

const isValidDate = (value) =>
  DATE_PATTERN.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00`));

export const searchPackingHistory = async (req, res, next) => {
  try {
    const boxQr = String(req.query.boxQr || "").trim();
    const dateFrom = String(req.query.dateFrom || "").trim();
    const dateTo = String(req.query.dateTo || "").trim();
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const requestedPageSize =
      Number.parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE;
    const pageSize = Math.min(Math.max(1, requestedPageSize), MAX_PAGE_SIZE);

    if (!boxQr && !dateFrom && !dateTo) {
      return fail(
        res,
        "Box QR or date range is required",
        400,
        "SEARCH_CONDITION_REQUIRED",
      );
    }

    if (Boolean(dateFrom) !== Boolean(dateTo)) {
      return fail(
        res,
        "Both start date and end date are required",
        400,
        "INCOMPLETE_DATE_RANGE",
      );
    }

    if (
      (dateFrom && (!isValidDate(dateFrom) || !isValidDate(dateTo))) ||
      (dateFrom && dateFrom > dateTo)
    ) {
      return fail(res, "Invalid date range", 400, "INVALID_DATE_RANGE");
    }

    if (boxQr.length > 26) {
      return fail(res, "Box QR is invalid", 400, "INVALID_BOX_QR");
    }

    const result = await PackingHistoryModel.search({
      boxQr,
      dateFrom,
      dateTo,
      page,
      pageSize,
    });

    return ok(res, result.rows, "Packing history retrieved successfully", {
      page,
      pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / pageSize),
    });
  } catch (error) {
    return next(error);
  }
};
