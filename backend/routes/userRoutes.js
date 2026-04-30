const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// ── Authentication & Auth / Public Routes ─────────────────────────────────────
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);

// ── Profile / Protected User Routes ───────────────────────────────────────────
// Profile Details
router.get("/profile", protect, userController.getUserProfile);
router.put("/profile", protect, userController.updateUserProfile);

// Change Password
router.put("/change-password", protect, userController.changePassword);

// User Dashboard
router.get("/dashboard", protect, userController.getUserDashboard);

// ── Admin Routes ──────────────────────────────────────────────────────────────
router.get("/", protect, adminOnly, userController.getUsers);

module.exports = router;