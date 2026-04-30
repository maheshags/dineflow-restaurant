const User = require("../models/User");
const Food = require("../models/Food");
const Order = require("../models/Order");

const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalFoods,
            totalOrders,
            pendingOrders,
            deliveredOrders,
            cancelledOrders,
            lowStockFoods,
            revenueResult
        ] = await Promise.all([
            User.countDocuments(),
            Food.countDocuments(),
            Order.countDocuments(),
            Order.countDocuments({ status: "pending" }),
            Order.countDocuments({ status: "delivered" }),
            Order.countDocuments({ status: "cancelled" }),
            Food.countDocuments({ stock: { $lt: 5 } }),
            Order.aggregate([
                {
                    $match: {
                        status: { $ne: "cancelled" }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$totalPrice" }
                    }
                }
            ])
        ]);

        const totalRevenue =
            revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        res.status(200).json({
            success: true,
            dashboard: {
                totalUsers,
                totalFoods,
                totalOrders,
                totalRevenue,
                pendingOrders,
                deliveredOrders,
                cancelledOrders,
                lowStockFoods
            }
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard stats"
        });
    }
};

const getTopSellingFoods = async (req, res) => {
    try {
        const topFoods = await Order.aggregate([
            {
                $match: {
                    status: { $ne: "cancelled" }
                }
            },
            {
                $addFields: {
                    totalQty: { $sum: "$items.quantity" }
                }
            },
            {
                $unwind: "$items"
            },
            {
                $group: {
                    _id: "$items.food",
                    totalSold: { $sum: "$items.quantity" },
                    revenue: {
                        $sum: {
                            $multiply: [
                                { $divide: ["$totalPrice", "$totalQty"] },
                                "$items.quantity"
                            ]
                        }
                    }
                }
            },
            {
                $sort: { totalSold: -1 }
            },
            {
                $lookup: {
                    from: "foods",
                    localField: "_id",
                    foreignField: "_id",
                    as: "foodDetails"
                }
            },
            {
                $unwind: "$foodDetails"
            },
            {
                $project: {
                    _id: 0,
                    foodId: "$foodDetails._id",
                    foodName: "$foodDetails.name",
                    totalSold: 1,
                    revenue: { $round: ["$revenue", 2] }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            topFoods
        });
    } catch (error) {
        console.error("Top selling error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch top selling foods"
        });
    }
};

const getDailyOrders = async (req, res) => {
    try {
        const dailyOrders = await Order.aggregate([
            {
                $match: {
                    status: { $ne: "cancelled" }
                }
            },
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$createdAt"
                            }
                        }
                    },
                    totalOrders: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.date": 1 }
            },
            {
                $project: {
                    _id: 0,
                    date: "$_id.date",
                    totalOrders: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            dailyOrders
        });
    } catch (error) {
        console.error("Daily orders error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch daily orders"
        });
    }
};
const getRevenueAnalytics = async (req, res) => {
    try {
        const totalRevenueResult = await Order.aggregate([
            {
                $match: {
                    status: { $ne: "cancelled" }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalPrice" }
                }
            }
        ]);

        const dailyRevenue = await Order.aggregate([
            {
                $match: {
                    status: { $ne: "cancelled" }
                }
            },
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$createdAt"
                            }
                        }
                    },
                    revenue: { $sum: "$totalPrice" }
                }
            },
            {
                $sort: { "_id.date": 1 }
            },
            {
                $project: {
                    _id: 0,
                    date: "$_id.date",
                    revenue: 1
                }
            }
        ]);

        const totalRevenue =
            totalRevenueResult.length > 0
                ? totalRevenueResult[0].totalRevenue
                : 0;

        res.status(200).json({
            success: true,
            totalRevenue,
            dailyRevenue
        });
    } catch (error) {
        console.error("Revenue analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch revenue analytics"
        });
    }
};
const Rating = require("../models/Rating");

const getPopularFoodsByOrders = async (req, res) => {
    try {
        const popularFoods = await Order.aggregate([
            {
                $match: {
                    status: { $ne: "cancelled" }
                }
            },
            {
                $unwind: "$items"
            },
            {
                $group: {
                    _id: "$items.food",
                    totalOrders: { $sum: 1 },
                    totalSold: { $sum: "$items.quantity" }
                }
            },
            {
                $sort: { totalSold: -1 }
            },
            {
                $lookup: {
                    from: "foods",
                    localField: "_id",
                    foreignField: "_id",
                    as: "foodDetails"
                }
            },
            {
                $unwind: "$foodDetails"
            },
            {
                $project: {
                    _id: 0,
                    foodId: "$foodDetails._id",
                    foodName: "$foodDetails.name",
                    price: "$foodDetails.price",
                    category: "$foodDetails.category",
                    totalOrders: 1,
                    totalSold: 1
                }
            },
            {
                $limit: 10
            }
        ]);

        res.status(200).json({
            success: true,
            popularFoods
        });
    } catch (error) {
        console.error("Popular foods by orders error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch popular foods by orders"
        });
    }
};
const getPopularFoodsByRatings = async (req, res) => {
    try {
        const popularFoods = await Rating.aggregate([
            {
                $group: {
                    _id: "$food",
                    averageRating: { $avg: "$rating" },
                    totalRatings: { $sum: 1 }
                }
            },
            {
                $sort: { averageRating: -1, totalRatings: -1 }
            },
            {
                $lookup: {
                    from: "foods",
                    localField: "_id",
                    foreignField: "_id",
                    as: "foodDetails"
                }
            },
            {
                $unwind: "$foodDetails"
            },
            {
                $project: {
                    _id: 0,
                    foodId: "$foodDetails._id",
                    foodName: "$foodDetails.name",
                    price: "$foodDetails.price",
                    category: "$foodDetails.category",
                    averageRating: { $round: ["$averageRating", 1] },
                    totalRatings: 1
                }
            },
            {
                $limit: 10
            }
        ]);

        res.status(200).json({
            success: true,
            popularFoods
        });
    } catch (error) {
        console.error("Popular foods by ratings error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch popular foods by ratings"
        });
    }
};

const getLowStockFoods = async (req, res) => {
    try {
        const threshold = Number(req.query.threshold) || 5;

        const foods = await Food.find({
            stock: { $lt: threshold }
        }).select("name stock price category");

        res.status(200).json({
            success: true,
            threshold,
            count: foods.length,
            foods
        });
    } catch (error) {
        console.error("Low stock foods error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch low stock foods"
        });
    }
};

const getMonthlyRevenueAnalytics = async (req, res) => {
    try {
        const monthlyRevenue = await Order.aggregate([
            {
                $match: {
                    status: { $ne: "cancelled" }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    totalRevenue: { $sum: "$totalPrice" },
                    totalOrders: { $sum: 1 }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            },
            {
                $project: {
                    _id: 0,
                    year: "$_id.year",
                    month: "$_id.month",
                    totalRevenue: 1,
                    totalOrders: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            monthlyRevenue
        });
    } catch (error) {
        console.error("Monthly revenue analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch monthly revenue analytics"
        });
    }
};

const getCategoryWiseSalesAnalytics = async (req, res) => {
    try {
        const categorySales = await Order.aggregate([
            {
                $match: {
                    status: { $ne: "cancelled" }
                }
            },
            {
                $addFields: {
                    totalQty: { $sum: "$items.quantity" }
                }
            },
            {
                $unwind: "$items"
            },
            {
                $lookup: {
                    from: "foods",
                    localField: "items.food",
                    foreignField: "_id",
                    as: "foodDetails"
                }
            },
            {
                $unwind: "$foodDetails"
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "foodDetails.category",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            {
                $unwind: "$categoryDetails"
            },
            {
                $group: {
                    _id: "$categoryDetails._id",
                    categoryName: { $first: "$categoryDetails.name" },
                    totalSold: { $sum: "$items.quantity" },
                    totalOrders: { $sum: 1 },
                    revenue: {
                        $sum: {
                            $multiply: [
                                { $divide: ["$totalPrice", "$totalQty"] },
                                "$items.quantity"
                            ]
                        }
                    }
                }
            },
            {
                $sort: {
                    revenue: -1
                }
            },
            {
                $project: {
                    _id: 0,
                    categoryId: "$_id",
                    categoryName: 1,
                    totalSold: 1,
                    totalOrders: 1,
                    revenue: { $round: ["$revenue", 2] }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            categorySales
        });
    } catch (error) {
        console.error("Category-wise sales analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch category-wise sales analytics"
        });
    }
};

module.exports = {
    getDashboardStats,
    getTopSellingFoods,
    getDailyOrders,
    getRevenueAnalytics,
    getPopularFoodsByOrders,
    getPopularFoodsByRatings,
    getLowStockFoods,
    getCategoryWiseSalesAnalytics,
    getMonthlyRevenueAnalytics
};

