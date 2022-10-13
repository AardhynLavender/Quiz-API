import { Router } from "express";
const authRouter = Router();
const sessionRouter = Router();

import { Register, Login, Logout } from "../../controllers/v1/auth";

/**
 * Authentication Routes
 * @author Aardhyn Lavender
 * @description   Routes to facilitate user authentication and session expiration.
 *
 * API
 *
 * @link POST /register
 * @param {Body} User data to create a new user
 *
 * @link POST /login
 * @param {Body} Credentials to login
 *
 * @link GET /logout
 * @param {Header} Authorization The session to expire
 */

authRouter.route("/register").post(Register);
authRouter.route("/login").post(Login);
sessionRouter.route("/logout").get(Logout);

export { authRouter, sessionRouter };
