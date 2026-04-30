const Cart = require("../models/Cart");
const Food = require("../models/Food");

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPER — populateCart
// Always return the cart with food details populated,
// so every response gives the frontend everything it needs to render.
// ─────────────────────────────────────────────────────────────────────────────
const populateCart = (cart) =>
    cart.populate({
        path:   "items.food",
        select: "name price image category stock availability description"
    });

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cart/add
// Body: { foodId, quantity }
//
// Logic:
//  1. Validate food exists and is available
//  2. Check requested quantity <= food.stock
//  3. If food already in cart → increase quantity (checking cumulative stock)
//  4. If food not in cart    → push new item with price snapshot
//  5. Recalculate totalAmount, save, return populated cart
// ─────────────────────────────────────────────────────────────────────────────
exports.addToCart = async (req, res) => {
    try {
        const { foodId, quantity } = req.body;

        // ── Input validation ──────────────────────────────────────────────────
        if (!foodId) {
            return res.status(400).json({ success: false, message: "foodId is required" });
        }

        const qty = parseInt(quantity, 10);
        if (!qty || qty < 1) {
            return res.status(400).json({
                success: false,
                message: "quantity must be a positive integer"
            });
        }

        // ── Fetch food ────────────────────────────────────────────────────────
        const food = await Food.findById(foodId);
        if (!food) {
            return res.status(404).json({ success: false, message: "Food item not found" });
        }

        if (!food.availability) {
            return res.status(400).json({
                success: false,
                message: `"${food.name}" is currently unavailable`
            });
        }

        if (food.stock <= 0) {
            return res.status(400).json({
                success: false,
                message: `"${food.name}" is out of stock`
            });
        }

        // ── Find or initialise cart for this user ─────────────────────────────
        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [], totalAmount: 0 });
        }

        // ── Check if item already exists in cart ──────────────────────────────
        const existingIndex = cart.items.findIndex(
            (item) => item.food.toString() === foodId
        );

        if (existingIndex > -1) {
            // Item already in cart — bump quantity
            const newQty = cart.items[existingIndex].quantity + qty;

            if (newQty > food.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Not enough stock. Available: ${food.stock}, In cart: ${cart.items[existingIndex].quantity}, Requested extra: ${qty}`
                });
            }

            cart.items[existingIndex].quantity = newQty;
        } else {
            // New item — check stock for requested quantity
            if (qty > food.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Not enough stock. Requested: ${qty}, Available: ${food.stock}`
                });
            }

            cart.items.push({
                food:     food._id,
                quantity: qty,
                price:    food.price   // snapshot current price
            });
        }

        // ── Recalculate total and persist ─────────────────────────────────────
        cart.recalculateTotal();
        await cart.save();

        // ── Populate and respond ──────────────────────────────────────────────
        await populateCart(cart);

        return res.status(200).json({
            success: true,
            message: `"${food.name}" added to cart`,
            data:    cart
        });

    } catch (error) {
        console.error("addToCart error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/cart
// Returns the logged-in user's cart with all food details populated.
// Returns an empty cart shape (not 404) if the user has no cart yet.
// ─────────────────────────────────────────────────────────────────────────────
exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id });

        // Return empty cart structure if user has never added anything
        if (!cart) {
            return res.json({
                success: true,
                data: {
                    user:        req.user._id,
                    items:       [],
                    totalAmount: 0
                }
            });
        }

        await populateCart(cart);

        return res.json({ success: true, data: cart });

    } catch (error) {
        console.error("getCart error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/cart/update
// Body: { foodId, quantity }
//
// Logic:
//  - quantity = 0   → remove item from cart  (same as DELETE /remove/:foodId)
//  - quantity >= 1  → set absolute quantity (not increment)
//  - Validates new quantity against food.stock
// ─────────────────────────────────────────────────────────────────────────────
exports.updateCartItem = async (req, res) => {
    try {
        const { foodId, quantity } = req.body;

        // ── Input validation ──────────────────────────────────────────────────
        if (!foodId) {
            return res.status(400).json({ success: false, message: "foodId is required" });
        }

        const qty = parseInt(quantity, 10);
        if (isNaN(qty) || qty < 0) {
            return res.status(400).json({
                success: false,
                message: "quantity must be 0 (to remove) or a positive integer"
            });
        }

        // ── Find cart ─────────────────────────────────────────────────────────
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart || cart.items.length === 0) {
            return res.status(404).json({ success: false, message: "Cart is empty" });
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.food.toString() === foodId
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "This food item is not in your cart"
            });
        }

        // ── quantity = 0 → remove item ────────────────────────────────────────
        if (qty === 0) {
            cart.items.splice(itemIndex, 1);
            cart.recalculateTotal();
            await cart.save();
            await populateCart(cart);

            return res.json({
                success: true,
                message: "Item removed from cart",
                data:    cart
            });
        }

        // ── quantity >= 1 → validate stock and update ─────────────────────────
        const food = await Food.findById(foodId);
        if (!food) {
            return res.status(404).json({ success: false, message: "Food item not found" });
        }

        if (qty > food.stock) {
            return res.status(400).json({
                success: false,
                message: `Only ${food.stock} unit(s) available in stock`
            });
        }

        // Update both quantity and refresh the price snapshot
        cart.items[itemIndex].quantity = qty;
        cart.items[itemIndex].price    = food.price;

        cart.recalculateTotal();
        await cart.save();
        await populateCart(cart);

        return res.json({
            success: true,
            message: "Cart updated",
            data:    cart
        });

    } catch (error) {
        console.error("updateCartItem error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/cart/remove/:foodId
// Removes a single food item from the cart.
// ─────────────────────────────────────────────────────────────────────────────
exports.removeFromCart = async (req, res) => {
    try {
        const { foodId } = req.params;

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.food.toString() === foodId
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "This food item is not in your cart"
            });
        }

        cart.items.splice(itemIndex, 1);
        cart.recalculateTotal();
        await cart.save();
        await populateCart(cart);

        return res.json({
            success: true,
            message: "Item removed from cart",
            data:    cart
        });

    } catch (error) {
        console.error("removeFromCart error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/cart/clear
// Empties the entire cart (keeps the cart document, just clears items & total).
// ─────────────────────────────────────────────────────────────────────────────
exports.clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return res.json({
                success: true,
                message: "Cart is already empty",
                data:    { user: req.user._id, items: [], totalAmount: 0 }
            });
        }

        cart.items       = [];
        cart.totalAmount = 0;
        await cart.save();

        return res.json({
            success: true,
            message: "Cart cleared",
            data:    cart
        });

    } catch (error) {
        console.error("clearCart error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
