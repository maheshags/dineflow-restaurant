const express = require("express");
const router = express.Router();

const inventoryController = require("../controllers/inventoryController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Public routes
router.get("/low-stock", inventoryController.getLowStockItems);
router.get("/", inventoryController.getInventory);
router.get("/:id", inventoryController.getInventoryItem);

// Admin only routes
router.put("/:id", protect, adminOnly, inventoryController.updateInventoryItem);
router.patch("/:id/stock", protect, adminOnly, inventoryController.updateStock);

module.exports = router;
