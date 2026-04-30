const Food = require("../models/Food");
const Category = require("../models/Category");

// GET ALL INVENTORY ITEMS
const getInventory = async (req, res) => {
    try {
        const foods = await Food.find().populate("category");

        const inventoryItems = foods.map(food => {
            const stock = food.stock || 0;
            let status;
            if (stock === 0) {
                status = 'out-of-stock';
            } else if (stock <= 10) {
                status = 'low-stock';
            } else {
                status = 'in-stock';
            }

            return {
                _id: food._id,
                foodId: food._id,
                foodName: food.name,
                category: food.category?.name || "Unknown",
                currentStock: stock,
                minThreshold: 10, // Default threshold
                status: status,
                updatedAt: food.updatedAt,
                createdAt: food.createdAt
            };
        });

        res.json({ inventory: inventoryItems });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET SINGLE INVENTORY ITEM
const getInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const food = await Food.findById(id).populate("category");

        if (!food) {
            return res.status(404).json({ message: "Food item not found" });
        }

        const stock = food.stock || 0;
        let status;
        if (stock === 0) {
            status = 'out-of-stock';
        } else if (stock <= 10) {
            status = 'low-stock';
        } else {
            status = 'in-stock';
        }

        res.json({
            inventory: {
                _id: food._id,
                foodId: food._id,
                foodName: food.name,
                category: food.category?.name || "Unknown",
                currentStock: stock,
                minThreshold: 10,
                status: status,
                updatedAt: food.updatedAt,
                createdAt: food.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE INVENTORY ITEM
const updateInventoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentStock, minThreshold } = req.body;

        const food = await Food.findByIdAndUpdate(
            id,
            {
                stock: currentStock !== undefined ? currentStock : undefined,
                availability: currentStock > 0
            },
            { new: true, runValidators: true }
        ).populate("category");

        if (!food) {
            return res.status(404).json({ message: "Food item not found" });
        }

        const stock = food.stock || 0;
        let status;
        if (stock === 0) {
            status = 'out-of-stock';
        } else if (stock <= (minThreshold || 10)) {
            status = 'low-stock';
        } else {
            status = 'in-stock';
        }

        res.json({
            inventory: {
                _id: food._id,
                foodId: food._id,
                foodName: food.name,
                category: food.category?.name || "Unknown",
                currentStock: stock,
                minThreshold: minThreshold || 10,
                status: status,
                updatedAt: food.updatedAt,
                createdAt: food.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE ONLY STOCK
const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;

        if (stock === undefined || typeof stock !== 'number') {
            return res.status(400).json({ message: "Stock quantity is required" });
        }

        const food = await Food.findByIdAndUpdate(
            id,
            {
                stock: stock,
                availability: stock > 0
            },
            { new: true, runValidators: true }
        ).populate("category");

        if (!food) {
            return res.status(404).json({ message: "Food item not found" });
        }

        const currentStock = food.stock || 0;
        let status;
        if (currentStock === 0) {
            status = 'out-of-stock';
        } else if (currentStock <= 10) {
            status = 'low-stock';
        } else {
            status = 'in-stock';
        }

        res.json({
            inventory: {
                _id: food._id,
                foodId: food._id,
                foodName: food.name,
                category: food.category?.name || "Unknown",
                currentStock: currentStock,
                minThreshold: 10,
                status: status,
                updatedAt: food.updatedAt,
                createdAt: food.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET LOW STOCK ITEMS
const getLowStockItems = async (req, res) => {
    try {
        const threshold = parseInt(req.query.threshold) || 10;
        const foods = await Food.find({ stock: { $lte: threshold } }).populate("category");

        const lowStockItems = foods.map(food => {
            const stock = food.stock || 0;
            return {
                _id: food._id,
                foodId: food._id,
                foodName: food.name,
                category: food.category?.name || "Unknown",
                currentStock: stock,
                minThreshold: threshold,
                status: "low-stock",
                updatedAt: food.updatedAt,
                createdAt: food.createdAt
            };
        });

        res.json({ inventory: lowStockItems });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getInventory,
    getInventoryItem,
    updateInventoryItem,
    updateStock,
    getLowStockItems
};
