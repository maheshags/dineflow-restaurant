const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analyticsController");

// Get revenue analytics (daily/weekly/monthly)
router.get("/revenue", analyticsController.getRevenueAnalytics);

// Get order analytics
router.get("/orders", analyticsController.getOrderAnalytics);

// Get top selling foods
router.get("/top-foods", analyticsController.getTopFoods);

// Get category distribution
router.get("/categories", analyticsController.getCategoryAnalytics);

// Get overall summary
router.get("/summary", analyticsController.getAnalyticsSummary);

module.exports = router;
