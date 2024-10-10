import express from "express";
import AuthController from "../controllers/auth.controller";

const authController = new AuthController();
const router = express.Router();

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/request-password-reset", authController.requestPasswordReset);
router.post("/reset-password", authController.resetPassword);

export default router;