import {ok, fail} from "../../middlewares/responseHandler.js";
import  UserModel from "../../models/admin/userSpec.model.js";

export const getAllUsers = async (req, res, next) => {
    try {
        const users = await UserModel.getAllUsers();
        if (!users) {
            return fail(res, req.t("user.noUsers"), 404);
        }
        return ok(res, users, "Success");
    } catch (err) {
        console.error("Get All Users Error:", err);
        return next(err);
    }
};
export const getUserById = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await UserModel.getUserById(userId);
        if (!user) {
            return fail(res, req.t("userSpec.userNotFound"), 404);
        }
        return ok(res, user, "Success");
    } catch (err) {
        console.error("Get User By Id Error:", err);
        return next(err);
    }
};
export const createUser = async (req, res, next) => {
    try {
        const userData = req.body;
        const user = await UserModel.createUser(userData);
        if (!user) {
            return fail(res, req.t("userSpec.createError"), 400);
        }
        return ok(res, user, req.t("userSpec.createSuccess"));
    } catch (err) {
        console.error("Create User Error:", err);
        return next(err);
    }
};
export const updateUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const userData = req.body;
        const user = await UserModel.updateUser(userId, userData);
        if (!user) {
            return fail(res, req.t("userSpec.userNotFound"), 404);
        }
        return ok(res, user, req.t("userSpec.updateSuccess"));
    } catch (err) {
        console.error("Update User Error:", err);
        return next(err);
    }
};
export const deleteUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await UserModel.deleteUser(userId);
        if (!user) {
            return fail(res, req.t("userSpec.userNotFound"), 404);
        }
        return ok(res, user, req.t("userSpec.deleteSuccess"));
    } catch (err) {
        console.error("Delete User Error:", err);
        return next(err);
    }
};
export const changeUserPassword = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;
        const user = await UserModel.changeUserPassword(userId, newPassword);
        if (!user) {
            return fail(res, req.t("user.userNotFound"), 404);
        }
        return ok(res, user, req.t("userSpec.changePasswordSuccess"));
    } catch (err) {
        console.error("Change User Password Error:", err);
        return next(err);
    }
};

