export const normalizePermission = (value = "") =>
  value.toString().trim().toUpperCase().replace(/[\s_-]+/g, "");

export const parsePermissions = (value = "") =>
  value
    .split(",")
    .map(normalizePermission)
    .filter(Boolean);

export const hasPermission = (value, requiredPermission) => {
  if (!requiredPermission) return true;
  return parsePermissions(value).includes(normalizePermission(requiredPermission));
};

