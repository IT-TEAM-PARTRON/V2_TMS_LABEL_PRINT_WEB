/**
 * Success response
 * @param {Response} res - Express response object
 * @param {*} data - Main payload (Object/Array)
 * @param {string} message - Success message
 * @param {object} meta - Pagination data (optional)
 * @param {number} status - HTTP Status Code
 */
export const ok = (res, data = null, message = "Success", meta = null, status = 200) => {
  const response = {
    success: true,
    message,
  };

  // Chỉ gắn data và meta vào JSON nếu chúng có giá trị
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;

  return res.status(status).json(response);
};

/**
 * Error response
 * @param {Response} res - Express response object
 * @param {string} message - Error message for user
 * @param {number} status - HTTP Status Code
 * @param {string} errorCode - Specific code for Frontend logic (e.g., "MAC_DUPLICATED")
 * @param {*} errors - Detailed validation errors (optional)
 */
export const fail = (
  res,
  message = "Something went wrong",
  status = 400,
  errorCode = "INTERNAL_ERROR",
  errors = null
) => {
  const response = {
    success: false,
    message,
    error_code: errorCode,
  };

  // Chỉ gắn errors vào JSON nếu có lỗi chi tiết (vd: lỗi validate form)
  if (errors !== null) response.errors = errors;

  return res.status(status).json(response);
};