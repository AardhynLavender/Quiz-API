import { Router } from "express";
const router = Router();

import { Register, Login } from "../../controllers/v1/auth";

router.route("/register").post(Register);
router.route("/login").post(Login);

export default router;
