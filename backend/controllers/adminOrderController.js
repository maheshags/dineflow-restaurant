const Order = require("../models/Order");
const User  = require("../models/User");
const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────────────────────
// ALLOWED ENUM VALUES — single source of truth for validation
// ─────────────────────────────────────────────────────────────────────────────
const VALID_ORDER_STATUSES = [
    "pending", "accepted", "preparing", "ready",
    "assigned", "picked", "out_for_delivery", "delivered", "cancelled"
];

const VALID_PAYMENT_STATUSES = ["pending", "paid", "failed"];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — validate ObjectId
// ─────────────────────────────────────────────────────────────────────────────
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/orders
// Returns ALL orders, newest first.
// Populates: user (name, email, phone), assignedDeliveryPerson (name, email, phone)
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllOrders = async (req, res) => {
    try {
        // Optional filters via query params
        const filter = {};

        if (req.query.status) {
            if (!VALID_ORDER_STATUSES.includes(req.query.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status filter. Allowed: ${VALID_ORDER_STATUSES.join(", ")}`
                });
            }
            filter.orderStatus = req.query.status;
        }

        if (req.query.paymentStatus) {
            if (!VALID_PAYMENT_STATUSES.includes(req.query.paymentStatus)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid paymentStatus filter. Allowed: ${VALID_PAYMENT_STATUSES.join(", ")}`
                });
            }
            filter.paymentStatus = req.query.paymentStatus;
        }

        const orders = await Order.find(filter)
            .populate("user",                   "name email phone")
            .populate("assignedDeliveryPerson", "name email phone")
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            count:   orders.length,
            data:    orders
        });

    } catch (error) {
        console.error("getAllOrders error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/orders/:id
// Returns full details of a single order.
// ─────────────────────────────────────────────────────────────────────────────
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid order ID" });
        }

        const order = await Order.findById(id)
            .populate("user",                   "name email phone role")
            .populate("assignedDeliveryPerson", "name email phone");

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        return res.json({ success: true, data: order });

    } catch (error) {
        console.error("getOrderById (admin) error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/orders/:id/status
// Update the lifecycle status of an order.
// Body: { "orderStatus": "accepted" }
//
// Business rules:
//  - Cannot move a delivered/cancelled order to any other status
//  - Cannot un-cancel an order
// ─────────────────────────────────────────────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid order ID" });
        }

        if (!orderStatus) {
            return res.status(400).json({ success: false, message: "orderStatus is required" });
        }

        if (!VALID_ORDER_STATUSES.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid orderStatus. Allowed values: ${VALID_ORDER_STATUSES.join(", ")}`
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Guard: cannot change status on a terminal order
        if (order.orderStatus === "delivered" && orderStatus !== "delivered") {
            return res.status(400).json({
                success: false,
                message: "Cannot change status of a delivered order"
            });
        }

        if (order.orderStatus === "cancelled" && orderStatus !== "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cannot reopen a cancelled order"
            });
        }

        // Set deliveredAt timestamp when marking as delivered
        const updates = { orderStatus };
        if (orderStatus === "delivered") {
            updates.deliveredAt = new Date();
        }

        const updatedOrder = await Order.findByIdAndUpdate(id, updates, { new: true })
            .populate("user",                   "name email phone")
            .populate("assignedDeliveryPerson", "name email phone");

        return res.json({
            success: true,
            message: `Order status updated to "${orderStatus}"`,
            data:    updatedOrder
        });

    } catch (error) {
        console.error("updateOrderStatus error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/orders/:id/assign-delivery
// Assign a delivery person to an order.
// Body: { "deliveryPersonId": "USER_ID" }
//
// Business rules:
//  - deliveryPersonId must be a User with role === "delivery"
//  - Order status automatically moves to "assigned"
//  - Cannot assign to delivered or cancelled orders
// ─────────────────────────────────────────────────────────────────────────────
exports.assignDeliveryPerson = async (req, res) => {
    try {
        const { id } = req.params;
        const { deliveryPersonId } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid order ID" });
        }

        if (!deliveryPersonId) {
            return res.status(400).json({ success: false, message: "deliveryPersonId is required" });
        }

        if (!isValidId(deliveryPersonId)) {
            return res.status(400).json({ success: false, message: "Invalid deliveryPersonId" });
        }

        // Validate delivery person exists and has correct role
        const deliveryPerson = await User.findById(deliveryPersonId).select("name email phone role");
        if (!deliveryPerson) {
            return res.status(404).json({
                success: false,
                message: "Delivery person not found"
            });
        }

        if (deliveryPerson.role !== "delivery") {
            return res.status(400).json({
                success: false,
                message: `User "${deliveryPerson.name}" is not a delivery agent (role: ${deliveryPerson.role})`
            });
        }

        // Validate order
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (["delivered", "cancelled"].includes(order.orderStatus)) {
            return res.status(400).json({
                success: false,
                message: `Cannot assign delivery to a ${order.orderStatus} order`
            });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            {
                assignedDeliveryPerson: deliveryPersonId,
                orderStatus:            "assigned"
            },
            { new: true }
        )
            .populate("user",                   "name email phone")
            .populate("assignedDeliveryPerson", "name email phone");

        return res.json({
            success: true,
            message: `Order assigned to "${deliveryPerson.name}"`,
            data:    updatedOrder
        });

    } catch (error) {
        console.error("assignDeliveryPerson error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/orders/:id/payment-status
// Update the payment status of an order.
// Body: { "paymentStatus": "paid" }
// ─────────────────────────────────────────────────────────────────────────────
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid order ID" });
        }

        if (!paymentStatus) {
            return res.status(400).json({ success: false, message: "paymentStatus is required" });
        }

        if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid paymentStatus. Allowed values: ${VALID_PAYMENT_STATUSES.join(", ")}`
            });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { paymentStatus },
            { new: true }
        )
            .populate("user",                   "name email phone")
            .populate("assignedDeliveryPerson", "name email phone");

        return res.json({
            success: true,
            message: `Payment status updated to "${paymentStatus}"`,
            data:    updatedOrder
        });

    } catch (error) {
        console.error("updatePaymentStatus error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/orders/:id
// Soft-cancels the order (sets orderStatus to "cancelled").
// Hard delete is available but discouraged — commented out for safety.
// ─────────────────────────────────────────────────────────────────────────────
exports.cancelOrDeleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({ success: false, message: "Invalid order ID" });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.orderStatus === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Order is already cancelled"
            });
        }

        if (order.orderStatus === "delivered") {
            return res.status(400).json({
                success: false,
                message: "Cannot cancel a delivered order"
            });
        }

        // Soft cancel — preserve the record for analytics
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { orderStatus: "cancelled" },
            { new: true }
        )
            .populate("user",                   "name email phone")
            .populate("assignedDeliveryPerson", "name email phone");

        return res.json({
            success: true,
            message: "Order cancelled successfully",
            data:    updatedOrder
        });

        // ── Hard delete (uncomment only if truly needed) ───────────────────────
        // await Order.findByIdAndDelete(id);
        // return res.json({ success: true, message: "Order permanently deleted" });

    } catch (error) {
        console.error("cancelOrDeleteOrder error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
