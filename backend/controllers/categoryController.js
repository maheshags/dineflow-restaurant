const Category = require("../models/Category");
const Food = require("../models/Food");

// ADD CATEGORY
const addCategory = async (req, res) => {
    try {
        const { name, description, image, active } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Category name is required" });
        }

        const existingCategory = await Category.findOne({ name });

        if (existingCategory) {
            return res.status(400).json({ message: "Category already exists" });
        }

        const category = await Category.create({
            name,
            description: description || "",
            image: image || "",
            active: active !== false
        });

        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET ALL CATEGORIES
const getCategories = async (req, res) => {
    try {
        const categories = await Category.aggregate([
            {
                $lookup: {
                    from: "foods",
                    localField: "_id",
                    foreignField: "category",
                    as: "items"
                }
            },
            {
                $addFields: {
                    itemCount: { $size: "$items" }
                }
            },
            {
                $project: {
                    items: 0
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET SINGLE CATEGORY
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json(category);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// UPDATE CATEGORY
const updateCategory = async (req, res) => {
    try {
        const { name, description, image, active } = req.body;

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        if (name) category.name = name;
        if (description !== undefined) category.description = description;
        if (image !== undefined) category.image = image;
        if (active !== undefined) category.active = active !== false;

        const updatedCategory = await category.save();
        const itemCount = await Food.countDocuments({ category: updatedCategory._id });

        res.json({
            ...updatedCategory.toObject(),
            itemCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// DELETE CATEGORY
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        await category.deleteOne();

        res.json({ message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    addCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};
