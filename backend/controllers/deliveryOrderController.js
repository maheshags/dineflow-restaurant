const Order    = require("../models/Order");
const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────────────────────
// Statuses a delivery person is ALLOWED to set.
// They cannot touch admin-only statuses like pending/accepted/preparing/etc.
// ─────────────────────────────────────────────────────────────────────────────
const DELIVERY_ALLOWED_STATUSES = ["picked", "out_for_delivery", "delivered"];

// ─────────────────────────────────────────────────────────────────────────────
// Statuses that mean "this order is actively with this delivery person".
// Used to scope GET requests — we show all orders ever assigned, not just active.
// ─────────────────────────────────────────────────────────────────────────────
const ALL_DELIVERY_VISIBLE_STATUSES = [
    "assigned", "picked", "out_for_delivery", "delivered"
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — validate ObjectId
// ─────────────────────────────────────────────────────────────────────────────
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/delivery/orders
//
// Returns all orders assigned to the logged-in delivery person.
// Shows both active and completed (delivered) orders, newest first.
//
// Each order includes:
//   customerDetails: name, phone, location, address, instructions
//   items:           name, image, price, quantity (already snapshotted in Order)
//   totalAmount, paymentMethod, paymentStatus, orderStatus, placedAt
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyDeliveryOrders = async (req, res) => {
    try {
        // Optional ?status= filter (delivery-visible statuses only)
        const filter = { assignedDeliveryPerson: req.user._id };

        if (req.query.status) {
            if (!ALL_DELIVERY_VISIBLE_STATUSES.includes(req.query.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status filter. Allowed: ${ALL_DELIVERY_VISIBLE_STATUSES.join(", ")}`
                });
            }
            filter.orderStatus = req.query.status;
        }

        const orders = await Order.find(filter)
            .select(
                "customerDetails items totalAmount paymentMethod paymentStatus " +
                "orderStatus assignedDeliveryPerson placedAt deliveredAt createdAt updatedAt"
            )
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            count:   orders.length,
            data:    orders
        });

    } catch (error) {
        console.error("getMyDeliveryOrders error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/delivery/orders/:id
//
// Returns one order detail — only if it is assigned to this delivery person.
// Returns 403 for orders assigned to someone else, 404 if not found.
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyDeliveryOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid order ID" });
        }

        const order = await Order.findById(id).select(
            "customerDetails items totalAmount paymentMethod paymentStatus " +
            "orderStatus assignedDeliveryPerson placedAt deliveredAt createdAt updatedAt user"
        );

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Security: delivery person can only see orders assigned to them
        if (
            !order.assignedDeliveryPerson ||
            order.assignedDeliveryPerson.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied. This order is not assigned to you."
            });
        }

        return res.json({ success: true, data: order });

    } catch (error) {
        console.error("getMyDeliveryOrderById error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/delivery/orders/:id/status
//
// Delivery person updates the lifecycle status of an assigned order.
//
// Allowed values: picked, out_for_delivery, delivered
// Forbidden:      pending, accepted, preparing, ready, assigned, cancelled
//
// Business rules:
//   1. Order must be assigned to this delivery person.
//   2. Only statuses in DELIVERY_ALLOWED_STATUSES are accepted.
//   3. Cannot change a delivered order.
//   4. deliveredAt is auto-set when status becomes "delivered".
// ─────────────────────────────────────────────────────────────────────────────
exports.updateDeliveryOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;

        // ── Input validation ──────────────────────────────────────────────────
        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid order ID" });
        }

        if (!orderStatus) {
            return res.status(400).json({ success: false, message: "orderStatus is required" });
        }

        // Guard: only delivery-allowed statuses permitted
        if (!DELIVERY_ALLOWED_STATUSES.includes(orderStatus)) {
            return res.status(403).json({
                success: false,
                message: `Delivery persons can only set: ${DELIVERY_ALLOWED_STATUSES.join(", ")}. ` +
                         `Status "${orderStatus}" is reserved for admin use.`
            });
        }

        // ── Fetch order ───────────────────────────────────────────────────────
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // ── Ownership check ───────────────────────────────────────────────────
        if (
            !order.assignedDeliveryPerson ||
            order.assignedDeliveryPerson.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "Access denied. This order is not assigned to you."
            });
        }

        // ── Terminal state guard ──────────────────────────────────────────────
        if (order.orderStatus === "delivered") {
            return res.status(400).json({
                success: false,
                message: "This order has already been delivered. Status cannot be changed."
            });
        }

        if (order.orderStatus === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "This order has been cancelled. Status cannot be changed."
            });
        }

        // ── Apply update ──────────────────────────────────────────────────────
        const updates = { orderStatus };

        // Auto-set deliveredAt when marking as delivered
        if (orderStatus === "delivered") {
            updates.deliveredAt = new Date();
        }

        const updatedOrder = await Order.findByIdAndUpdate(id, updates, { new: true }).select(
            "customerDetails items totalAmount paymentMethod paymentStatus " +
            "orderStatus assignedDeliveryPerson placedAt deliveredAt createdAt updatedAt"
        );

        if (orderStatus === "delivered" && order.orderStatus !== "delivered") {
            const User = require("../models/User");
            await User.findByIdAndUpdate(req.user._id, { $inc: { totalDeliveries: 1 } });
        }

        return res.json({
            success: true,
            message: `Order status updated to "${orderStatus}"`,
            data:    updatedOrder
        });

    } catch (error) {
        console.error("updateDeliveryOrderStatus error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
