const express = require("express");
const router  = express.Router();

const foodController         = require("../controllers/foodController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — USER-FACING ROUTES
// Order matters: specific static paths MUST come before /:id
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/foods                  — all available foods (stock > 0)
router.get("/", foodController.getFoods);

// GET /api/foods/search?q=burger  — search by name/description
router.get("/search", foodController.searchFoods);

// GET /api/foods/categories       — list of distinct categories that have foods
router.get("/categories", foodController.getCategories);

// GET /api/foods/category/:category — filter by category ObjectId or name
router.get("/category/:category", foodController.getFoodsByCategory);

// GET /api/foods/:id              — single food detail + ratings
// ⚠️  Must come LAST to avoid swallowing /search, /categories, etc.
router.get("/:id", foodController.getFoodById);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN-ONLY ROUTES (protected — unchanged)
// ─────────────────────────────────────────────────────────────────────────────

// POST   /api/foods      — add new food
router.post("/", protect, adminOnly, foodController.addFood);

// PUT    /api/foods/:id  — update food
router.put("/:id", protect, adminOnly, foodController.updateFood);

// DELETE /api/foods/:id  — delete food
router.delete("/:id", protect, adminOnly, foodController.deleteFood);

module.exports = router;