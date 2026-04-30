const express = require("express");
const router  = express.Router();

const {
    placeOrderFromCart,
    placeOrder,
    getMyOrders,
    getOrderById
} = require("../controllers/orderController");

const { protect } = require("../middleware/authMiddleware");

// ─────────────────────────────────────────────────────────────────────────────
// All order routes require authentication
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/orders/place
// Primary checkout: reads from cart, validates stock, creates order, clears cart
router.post("/place", protect, placeOrderFromCart);

// GET  /api/orders/my-orders
// Returns all orders belonging to the logged-in user (newest first)
// ⚠️  Must come BEFORE /:id so "my-orders" is not treated as an orderId
router.get("/my-orders", protect, getMyOrders);

// GET  /api/orders/:id
// Returns a single order — only if it belongs to the logged-in user
router.get("/:id", protect, getOrderById);

// ── Legacy endpoints (backward compatible) ────────────────────────────────────

// POST /api/orders/my  — old alias for my-orders (kept for any existing frontend calls)
router.get("/my", protect, getMyOrders);

// POST /api/orders — old direct-items order (kept for Postman / admin testing)
router.post("/", protect, placeOrder);

module.exports = router;