const express = require("express");
const router  = express.Router();

const { register, login, deliveryLogin, getMe, sendOtp, verifyOtp } = require("../controllers/authController");
const { protect }                 = require("../middleware/authMiddleware");

// ── Public routes ─────────────────────────────────────────────────────────────
// POST /api/auth/register  — create a new normal user account
router.post("/register", register);

// POST /api/auth/login     — login for all roles (user / admin / delivery)
router.post("/login", login);
router.post("/delivery-login", deliveryLogin);

// ── Dummy OTP Login routes ────────────────────────────────────────────────────
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// ── Protected routes ──────────────────────────────────────────────────────────
// GET  /api/auth/me        — get currently logged-in user's profile
router.get("/me", protect, getMe);

module.exports = router;
