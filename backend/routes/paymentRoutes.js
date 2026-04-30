const express = require("express");
const router = express.Router();

const { getSettings, updateSettings } = require("../controllers/paymentController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// GET  /api/payments/settings  — fetch current payment configuration
router.get("/settings", protect, adminOnly, getSettings);

// PUT  /api/payments/settings  — create or update payment configuration
router.put("/settings", protect, adminOnly, updateSettings);

module.exports = router;
