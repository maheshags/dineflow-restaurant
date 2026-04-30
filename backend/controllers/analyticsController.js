const Order = require("../models/Order");
const Food = require("../models/Food");
const Category = require("../models/Category");
const Rating = require("../models/Rating");

// Helper function to group orders by date
const groupOrdersByDate = (orders, periodType = 'daily') => {
    const grouped = {};

    orders.forEach(order => {
        const date = new Date(order.createdAt);
        let key;

        if (periodType === 'daily') {
            // Group by day of week
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            key = days[date.getDay()];
        } else if (periodType === 'weekly') {
            // Group by week number
            const week = Math.ceil((date.getDate()) / 7);
            key = `Week ${week}`;
        } else if (periodType === 'monthly') {
            // Group by month
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            key = months[date.getMonth()];
        }

        if (!grouped[key]) {
            grouped[key] = { revenue: 0, orders: 0 };
        }

        grouped[key].revenue += order.totalPrice || order.totalAmount || 0;
        grouped[key].orders += 1;
    });

    return Object.entries(grouped).map(([name, data]) => ({
        name,
        revenue: Math.round(data.revenue),
        orders: data.orders,
    }));
};

// Get revenue analytics
const getRevenueAnalytics = async (req, res) => {
    try {
        const { period = 'daily' } = req.query;

        const orders = await Order.find({ status: { $ne: 'cancelled' } }).sort({ createdAt: 1 });

        const revenueData = groupOrdersByDate(orders, period);

        res.json({
            success: true,
            data: revenueData,
            period,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get order analytics
const getOrderAnalytics = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const completedOrders = await Order.countDocuments({ status: 'completed' });
        const pendingOrders = await Order.countDocuments({ status: 'new' });
        const acceptedOrders = await Order.countDocuments({ status: 'accepted' });
        const preparingOrders = await Order.countDocuments({ status: 'preparing' });
        const readyOrders = await Order.countDocuments({ status: 'ready' });
        const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

        res.json({
            success: true,
            data: {
                totalOrders,
                completedOrders,
                pendingOrders,
                acceptedOrders,
                preparingOrders,
                readyOrders,
                cancelledOrders,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get top selling foods
const getTopFoods = async (req, res) => {
    try {
        const limit = req.query.limit || 5;

        const topFoods = await Order.aggregate([
            {
                $unwind: '$items',
            },
            {
                $group: {
                    _id: '$items.foodId',
                    foodName: { $first: '$items.foodName' },
                    totalOrders: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
                },
            },
            {
                $sort: { totalOrders: -1 },
            },
            {
                $limit: Number(limit),
            },
        ]);

        res.json({
            success: true,
            data: topFoods.map(food => ({
                id: food._id,
                name: food.foodName,
                totalOrders: food.totalOrders,
                totalRevenue: Math.round(food.totalRevenue),
            })),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get category analytics
const getCategoryAnalytics = async (req, res) => {
    try {
        const categoryData = await Food.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoryInfo',
                },
            },
            {
                $unwind: {
                    path: '$categoryInfo',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 1,
                    name: { $ifNull: ['$categoryInfo.name', 'Unknown'] },
                    value: '$count',
                },
            },
            {
                $sort: { value: -1 },
            },
        ]);

        res.json({
            success: true,
            data: categoryData,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get overall analytics summary
const getAnalyticsSummary = async (req, res) => {
    try {
        const [
            totalRevenue,
            totalOrders,
            totalCustomers,
            averageRating,
            topFood,
        ] = await Promise.all([
            // Total revenue
            Order.aggregate([
                {
                    $match: { status: { $ne: 'cancelled' } },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $ifNull: ['$totalPrice', '$totalAmount'] } },
                    },
                },
            ]),
            // Total orders
            Order.countDocuments(),
            // Total customers
            Order.distinct('userId'),
            // Average rating
            Rating.aggregate([
                {
                    $group: {
                        _id: null,
                        average: { $avg: '$rating' },
                    },
                },
            ]),
            // Top selling food
            Order.aggregate([
                {
                    $unwind: '$items',
                },
                {
                    $group: {
                        _id: '$items.foodName',
                        orders: { $sum: '$items.quantity' },
                    },
                },
                {
                    $sort: { orders: -1 },
                },
                {
                    $limit: 1,
                },
            ]),
        ]);

        res.json({
            success: true,
            data: {
                totalRevenue: totalRevenue.length > 0 ? Math.round(totalRevenue[0].total) : 0,
                totalOrders: totalOrders,
                totalCustomers: totalCustomers.length,
                averageRating: averageRating.length > 0 ? Number(averageRating[0].average.toFixed(1)) : 0,
                topFood: topFood.length > 0 ? topFood[0]._id : 'N/A',
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getRevenueAnalytics,
    getOrderAnalytics,
    getTopFoods,
    getCategoryAnalytics,
    getAnalyticsSummary,
};
