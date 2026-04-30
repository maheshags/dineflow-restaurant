const express = require("express");
const router  = express.Router();

const {
    addOrUpdateRating,
    getFoodRatings,
    getAllRatings
} = require("../controllers/ratingController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// ── User APIs ─────────────────────────────────────────────────────────────────

// POST /api/ratings
// Add or update a rating (User must have ordered and received the item)
router.post("/", protect, addOrUpdateRating);

// GET /api/ratings/food/:foodId
// Publicly view ratings for a specific food
router.get("/food/:foodId", getFoodRatings);

// ── Admin APIs ────────────────────────────────────────────────────────────────

// GET /api/ratings
// Admin can view all ratings across the platform
router.get("/", protect, adminOnly, getAllRatings);

module.exports = router;