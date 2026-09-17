import { verifyAccessToken } from "../utils/jwt.js";

const authenticationError = (message, errorCode) => {
  const error = new Error(message);
  error.status = 401;
  error.errorCode = errorCode;
  return error;
};

export const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return next(authenticationError("Authentication required", "NO_TOKEN"));
  }

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(authenticationError("Invalid authorization header", "INVALID_TOKEN"));
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (error) {
    const errorCode = error.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "INVALID_TOKEN";
    return next(authenticationError("Invalid or expired access token", errorCode));
  }
};
