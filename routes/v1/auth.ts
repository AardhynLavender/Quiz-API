import { Router } from "express";
const authRouter = Router();
const sessionRouter = Router();

import { Register, Login, Logout } from "../../controllers/v1/auth";

authRouter.route("/register").post(Register);
authRouter.route("/login").post(Login);
sessionRouter.route("/logout").get(Logout);

export { authRouter, sessionRouter };
