import AuthUser from "../../models/auth/auth.model.js";
import { comparePassword } from "../../utils/hash.js";
import { createAccessToken } from "../../utils/jwt.js";
import { ok, fail } from "../../middlewares/responseHandler.js";

export const login = async (req, res) => {
  try {
    const { EMAIL, PASSWORD } = req.body;
    const user = await AuthUser.findUserByEmail(EMAIL);

    if (!user) {
      return fail(res, req.t("auth.userNotFound"), 401, "INVALID_CREDENTIALS");
    }

    const isMatch = await comparePassword(PASSWORD, user.PASSWORD);
    if (!isMatch) {
      return fail(res, req.t("auth.incorrectPassword"), 401, "INVALID_CREDENTIALS");
    }

    const { accessToken, expires_at } = createAccessToken(user);
    const userInfo = { ...user, accessToken, expires_at };
    delete userInfo.PASSWORD;

    return ok(res, userInfo, req.t("auth.loginSuccess"));
  } catch (error) {
    console.error("Login Error:", error);
    return fail(res, req.t("server.internalError"), 500);
  }
};

export const logout = (req, res) =>
  ok(res, {}, req.t("auth.logoutSuccessful"));
