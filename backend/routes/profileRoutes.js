const express = require("express");
const router = express.Router();

const { getProfile, updateProfile, changePassword } = require("../controllers/profileController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// GET  /api/profile          — fetch restaurant profile
router.get("/", protect, adminOnly, getProfile);

// PUT  /api/profile          — save / update restaurant profile
router.put("/", protect, adminOnly, updateProfile);

// PUT  /api/profile/change-password — change admin password
router.put("/change-password", protect, adminOnly, changePassword);

module.exports = router;
