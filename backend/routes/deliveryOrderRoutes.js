const express = require("express");
const router  = express.Router();

const {
    getMyDeliveryOrders,
    getMyDeliveryOrderById,
    updateDeliveryOrderStatus
} = require("../controllers/deliveryOrderController");

const { protect, deliveryOnly } = require("../middleware/authMiddleware");

// All routes require:
//   1. Valid JWT (protect)
//   2. role === "delivery" (deliveryOnly)
// ─────────────────────────────────────────────────────────────────────────────

// GET  /api/delivery/orders           → list assigned orders (newest first)
// Optional query: ?status=picked|out_for_delivery|delivered|assigned
router.get("/", protect, deliveryOnly, getMyDeliveryOrders);

// GET  /api/delivery/orders/:id       → single order (own assignment only)
// ⚠️  Must be above /:id/status to prevent Express matching "status" as an id
router.get("/:id", protect, deliveryOnly, getMyDeliveryOrderById);

// PUT  /api/delivery/orders/:id/status → update status (picked/out_for_delivery/delivered only)
router.put("/:id/status", protect, deliveryOnly, updateDeliveryOrderStatus);

module.exports = router;
