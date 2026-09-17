import db from "../config/db.js";

const normalizePermission = (value = "") =>
  value.toString().trim().toUpperCase().replace(/[\s_-]+/g, "");

const parsePermissions = (value = "") =>
  value
    .split(",")
    .map(normalizePermission)
    .filter(Boolean);

export const requireAnyPermission = (...requiredPermissions) => {
  const normalizedRequired = requiredPermissions.map(normalizePermission);

  return async (req, res, next) => {
    try {
      const rows = await db.query(
        `SELECT r.DESCRIPTION
         FROM USER u
         INNER JOIN ROLE r ON r.ROLEID = u.ROLEID
         WHERE u.ID = ?
         LIMIT 1`,
        [req.user.ID],
      );

      const currentPermissions = parsePermissions(rows[0]?.DESCRIPTION || "");
      const isAllowed = normalizedRequired.some((permission) =>
        currentPermissions.includes(permission),
      );

      if (!isAllowed) {
        const message = req.t ? req.t("auth.accessDenied") : "Access denied";
        const error = new Error(message);
        error.status = 403;
        error.errorCode = "ACCESS_DENIED";
        return next(error);
      }

      req.user.permissions = currentPermissions;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const requirePermission = (permission) =>
  requireAnyPermission(permission);
