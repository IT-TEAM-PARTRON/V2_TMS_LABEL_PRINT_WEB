import bcrypt from "bcryptjs";

export const hashPassword = (plain) => bcrypt.hashSync(plain, 10);
export const comparePasswordHash = (plain, hash) => bcrypt.compareSync(plain, hash);  //kiểm tra mật khẩu hash
export const comparePassword = (plain, hash) => plain == hash;  //kiểm tra mật khẩu goc
