import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TTL || "1d";

const getAccessSecret = () => {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }
  return process.env.JWT_ACCESS_SECRET;
};

export const createAccessToken = (user) => {
  const accessToken = jwt.sign(
    { ID: user.ID, USERID: user.USERID, type: "access" },
    getAccessSecret(),
    { expiresIn: ACCESS_TOKEN_TTL },
  );
  const { exp } = jwt.decode(accessToken);

  return {
    accessToken,
    expires_at: new Date(exp * 1000).toISOString(),
  };
};

export const verifyAccessToken = (token) =>
  jwt.verify(token, getAccessSecret());
