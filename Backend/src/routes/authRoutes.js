import express from "express";
import { registerUser, loginUser } from "../controllers/UserDataController.js";
const router = express.Router();

router.post('/signup', registerUser);
router.post("/login", loginUser);

export default router;