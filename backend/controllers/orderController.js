const Order = require("../models/Order");
const Food  = require("../models/Food");
const Cart  = require("../models/Cart");
const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — validate customerDetails fields
// ─────────────────────────────────────────────────────────────────────────────
const validateCustomerDetails = (cd) => {
    if (!cd)           return "customerDetails is required";
    if (!cd.name?.trim())     return "customerDetails.name is required";
    if (!cd.phone?.trim())    return "customerDetails.phone is required";
    if (!cd.location?.trim()) return "customerDetails.location is required";
    if (!cd.address?.trim())  return "customerDetails.address is required";
    return null; // valid
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders/place
//
// Full cart-to-order checkout flow:
//   1. Fetch user's cart (error if empty)
//   2. Validate customerDetails
//   3. Re-check live stock for EVERY cart item (fresh DB read)
//   4. Build enriched order items (snapshots: name, price, image)
//   5. Deduct stock atomically per item
//   6. Calculate totalAmount
//   7. Create Order document
//   8. Clear cart
//   9. Return order
// ─────────────────────────────────────────────────────────────────────────────
const placeOrderFromCart = async (req, res) => {
    try {
        const { customerDetails, paymentMethod } = req.body;

        // ── Step 1: validate customerDetails ─────────────────────────────────
        const validationError = validateCustomerDetails(customerDetails);
        if (validationError) {
            return res.status(400).json({ success: false, message: validationError });
        }

        // ── Step 2: fetch cart and check it is not empty ──────────────────────
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty. Add items before placing an order."
            });
        }

        // ── Step 3 & 4: re-validate stock + build enriched items ──────────────
        // We fetch each food fresh from DB (not from cart snapshot) to ensure
        // we have the latest stock count. Cart price snapshot is kept as-is.
        let totalAmount    = 0;
        const enrichedItems = [];
        const stockUpdates  = []; // collect [food, deductQty] pairs — apply after all checks pass

        for (const cartItem of cart.items) {
            const food = await Food.findById(cartItem.food);

            // Food may have been deleted since it was added to cart
            if (!food) {
                return res.status(404).json({
                    success: false,
                    message: `A food item in your cart no longer exists (ID: ${cartItem.food}). Please remove it and try again.`
                });
            }

            // Food may have been manually disabled by admin
            if (!food.availability) {
                return res.status(400).json({
                    success: false,
                    message: `"${food.name}" is currently unavailable. Please remove it from your cart.`
                });
            }

            // Live stock check
            if (food.stock < cartItem.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Not enough stock for "${food.name}". Available: ${food.stock}, In your cart: ${cartItem.quantity}`
                });
            }

            // Queue the stock deduction
            stockUpdates.push({ food, qty: cartItem.quantity });

            // Build snapshot item — use cart price (locked when user added to cart)
            enrichedItems.push({
                food:     food._id,
                name:     food.name,
                price:    cartItem.price,   // cart-locked price snapshot
                quantity: cartItem.quantity,
                image:    food.image || ""
            });

            totalAmount += cartItem.price * cartItem.quantity;
        }

        // ── Step 5: deduct stock (only after ALL checks pass) ─────────────────
        // This prevents partial deductions when one item fails validation.
        // We use updateOne to safely bypass document validation (e.g. legacy category formatting mismatches)
        for (const { food, qty } of stockUpdates) {
            await Food.updateOne({ _id: food._id }, { $inc: { stock: -qty } });
        }

        // ── Step 6: round total ───────────────────────────────────────────────
        totalAmount = Math.round(totalAmount * 100) / 100;

        // ── Step 7: create order ──────────────────────────────────────────────
        const order = await Order.create({
            user: req.user._id,
            customerDetails: {
                name:         customerDetails.name.trim(),
                phone:        customerDetails.phone.trim(),
                location:     customerDetails.location.trim(),
                address:      customerDetails.address.trim(),
                instructions: (customerDetails.instructions || "").trim()
            },
            items:         enrichedItems,
            totalAmount,
            paymentMethod: paymentMethod || "cash",
            paymentStatus: "pending",
            orderStatus:   "pending",
            placedAt:      new Date()
        });

        // ── Step 8: clear cart ────────────────────────────────────────────────
        cart.items       = [];
        cart.totalAmount = 0;
        await cart.save();

        // ── Step 9: respond ───────────────────────────────────────────────────
        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data:    order
        });

    } catch (error) {
        console.error("placeOrderFromCart error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/my-orders
// Returns ALL orders for the logged-in user, newest first.
// ─────────────────────────────────────────────────────────────────────────────
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            count:   orders.length,
            data:    orders
        });

    } catch (error) {
        console.error("getMyOrders error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/:id
// Returns a single order — only if it belongs to the logged-in user.
// ─────────────────────────────────────────────────────────────────────────────
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid order ID" });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Security: users can only view their own orders
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Access denied. This order does not belong to you."
            });
        }

        return res.json({ success: true, data: order });

    } catch (error) {
        console.error("getOrderById error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY — POST /api/orders (kept for backward compatibility)
// Accepts items[] directly in the body (old format used before cart was built).
// ─────────────────────────────────────────────────────────────────────────────
const placeOrder = async (req, res) => {
    try {
        const { items, customerDetails, paymentMethod } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "items array is required and must not be empty"
            });
        }

        let totalAmount    = 0;
        const enrichedItems = [];

        for (const item of items) {
            const food = await Food.findById(item.food);

            if (!food) {
                return res.status(404).json({
                    success: false,
                    message: `Food item not found: ${item.food}`
                });
            }

            if (food.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Not enough stock for "${food.name}". Available: ${food.stock}, Requested: ${item.quantity}`
                });
            }

            await Food.updateOne({ _id: food._id }, { $inc: { stock: -item.quantity } });

            totalAmount += food.price * item.quantity;

            enrichedItems.push({
                food:     food._id,
                name:     food.name,
                price:    food.price,
                quantity: item.quantity,
                image:    food.image || ""
            });
        }

        const resolvedCustomerDetails = customerDetails || {
            name:         req.user.name,
            phone:        req.user.phone || "",
            location:     "",
            address:      req.user.address || "",
            instructions: ""
        };

        const order = await Order.create({
            user:            req.user._id,
            customerDetails: resolvedCustomerDetails,
            items:           enrichedItems,
            totalAmount:     Math.round(totalAmount * 100) / 100,
            paymentMethod:   paymentMethod || "cash",
            paymentStatus:   "pending",
            orderStatus:     "pending",
            placedAt:        new Date()
        });

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data:    order
        });

    } catch (error) {
        console.error("placeOrder error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

module.exports = { placeOrderFromCart, placeOrder, getMyOrders, getOrderById };