const express = require("express");
const router  = express.Router();

const {
    getDashboardStats,
    getTopSellingFoods,
    getDailyOrders,
    getRevenueAnalytics,
    getPopularFoodsByOrders,
    getPopularFoodsByRatings,
    getLowStockFoods,
    getCategoryWiseSalesAnalytics,
    getMonthlyRevenueAnalytics
} = require("../controllers/adminController");

const foodController  = require("../controllers/foodController");
const userController  = require("../controllers/userController");
const ratingController = require("../controllers/ratingController");

const {
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    assignDeliveryPerson,
    updatePaymentStatus,
    cancelOrDeleteOrder
} = require("../controllers/adminOrderController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// ── Dashboard & Analytics ─────────────────────────────────────────────────────
router.get("/dashboard",                       protect, adminOnly, getDashboardStats);
router.get("/top-selling",                     protect, adminOnly, getTopSellingFoods);
router.get("/analytics/daily-orders",          protect, adminOnly, getDailyOrders);
router.get("/analytics/revenue",               protect, adminOnly, getRevenueAnalytics);
router.get("/analytics/popular-foods/orders",  protect, adminOnly, getPopularFoodsByOrders);
router.get("/analytics/popular-foods/ratings", protect, adminOnly, getPopularFoodsByRatings);
router.get("/low-stock",                       protect, adminOnly, getLowStockFoods);
router.get("/analytics/monthly-revenue",       protect, adminOnly, getMonthlyRevenueAnalytics);
router.get("/analytics/category-sales",        protect, adminOnly, getCategoryWiseSalesAnalytics);

// ── Foods Management ──────────────────────────────────────────────────────────
router.get("/foods",        protect, adminOnly, foodController.getAllFoodsForAdmin);
router.post("/foods",       protect, adminOnly, foodController.addFood);
router.put("/foods/:id",    protect, adminOnly, foodController.updateFood);
router.delete("/foods/:id", protect, adminOnly, foodController.deleteFood);

// ── Users Management ──────────────────────────────────────────────────────────
router.get("/users", protect, adminOnly, userController.getUsers);

// ── Order Management ──────────────────────────────────────────────────────────
// ⚠️  Specific sub-paths MUST be registered before /:id (catch-all)

// GET  /api/admin/orders                  → list all orders (with optional ?status= filter)
router.get("/orders",                       protect, adminOnly, getAllOrders);

// GET  /api/admin/orders/:id              → single order detail
router.get("/orders/:id",                  protect, adminOnly, getOrderById);

// PUT  /api/admin/orders/:id/status       → update order lifecycle status
router.put("/orders/:id/status",           protect, adminOnly, updateOrderStatus);

// PUT  /api/admin/orders/:id/assign-delivery → assign delivery person
router.put("/orders/:id/assign-delivery",  protect, adminOnly, assignDeliveryPerson);

// PUT  /api/admin/orders/:id/payment-status  → update payment status
router.put("/orders/:id/payment-status",   protect, adminOnly, updatePaymentStatus);

// DELETE /api/admin/orders/:id           → soft-cancel (or hard delete) an order
router.delete("/orders/:id",              protect, adminOnly, cancelOrDeleteOrder);

// ── Ratings Management ────────────────────────────────────────────────────────
router.get("/ratings", protect, adminOnly, async (req, res) => {
    try {
        const Rating = require("../models/Rating");
        const ratings = await Rating.find()
            .populate("user")
            .populate("food")
            .sort({ createdAt: -1 });
        res.json(ratings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
