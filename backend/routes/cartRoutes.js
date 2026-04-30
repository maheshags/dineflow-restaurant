const express = require("express");
const router  = express.Router();

const {
    addToCart,
    getCart,
    updateCartItem,
    removeFromCart,
    clearCart
} = require("../controllers/cartController");

const { protect } = require("../middleware/authMiddleware");

// All cart routes require a valid JWT — user must be logged in
// ─────────────────────────────────────────────────────────────────────────────

// GET    /api/cart               — view current cart
router.get("/", protect, getCart);

// POST   /api/cart/add           — add food to cart
router.post("/add", protect, addToCart);

// PUT    /api/cart/update        — update item quantity (0 = remove)
router.put("/update", protect, updateCartItem);

// DELETE /api/cart/clear         — wipe entire cart
// ⚠️  Must come BEFORE /remove/:foodId so "clear" is not matched as a foodId
router.delete("/clear", protect, clearCart);

// DELETE /api/cart/remove/:foodId — remove one item
router.delete("/remove/:foodId", protect, removeFromCart);

module.exports = router;
