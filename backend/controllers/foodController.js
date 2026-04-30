const Food     = require("../models/Food");
const Rating   = require("../models/Rating");
const Category = require("../models/Category");
const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────────────────────
// SHARED AGGREGATION HELPER
// Builds the full aggregation pipeline used by all user-facing list APIs.
// Accepts an optional `matchStage` to pre-filter documents before joining.
//
// Strategy (no N+1):
//   1. Match foods (optional category / text filter)
//   2. Lookup category details in one join
//   3. Lookup all ratings for those foods in one join
//   4. Add computed fields: averageRating, totalRatings, isAvailable
//   5. Project the exact shape the user needs
// ─────────────────────────────────────────────────────────────────────────────
const buildFoodPipeline = (matchStage = {}) => [
    // ── Step 1: filter foods ──────────────────────────────────────────────────
    { $match: matchStage },

    // ── Step 2: join category ─────────────────────────────────────────────────
    {
        $lookup: {
            from:         "categories",
            localField:   "category",
            foreignField: "_id",
            as:           "categoryInfo"
        }
    },
    {
        $unwind: {
            path:                       "$categoryInfo",
            preserveNullAndEmptyArrays: true   // food without category still appears
        }
    },

    // ── Step 3: join ratings (one DB round-trip for all foods) ────────────────
    {
        $lookup: {
            from:         "ratings",
            localField:   "_id",
            foreignField: "food",
            as:           "ratingDocs"
        }
    },

    // ── Step 4: compute rating stats inline ───────────────────────────────────
    {
        $addFields: {
            totalRatings: { $size: "$ratingDocs" },
            averageRating: {
                $cond: [
                    { $gt: [{ $size: "$ratingDocs" }, 0] },
                    {
                        $round: [
                            { $avg: "$ratingDocs.rating" },
                            1
                        ]
                    },
                    0
                ]
            },
            isAvailable: {
                $and: [
                    { $eq: ["$availability", true] },
                    { $gt:  ["$stock", 0] }
                ]
            }
        }
    },

    // ── Step 5: project final shape ───────────────────────────────────────────
    {
        $project: {
            _id:          1,
            name:         1,
            price:        1,
            stock:        1,
            image:        1,
            description:  1,
            availability: 1,
            isAvailable:  1,
            createdAt:    1,
            updatedAt:    1,
            averageRating: 1,
            totalRatings:  1,
            category: {
                _id:         "$categoryInfo._id",
                name:        "$categoryInfo.name",
                description: "$categoryInfo.description",
                image:       "$categoryInfo.image"
            }
        }
    },

    // ── Step 6: sort by name (stable, predictable order) ─────────────────────
    { $sort: { name: 1 } }
];

const resolveCategoryId = async (category) => {
    if (!category) return null;

    if (mongoose.Types.ObjectId.isValid(category)) {
        return category;
    }

    const existingCategory = await Category.findOne({
        name: { $regex: `^${category}$`, $options: "i" }
    });

    return existingCategory?._id || null;
};

const getFoodForAdminById = async (id) => {
    const foods = await Food.aggregate(buildFoodPipeline({
        _id: new mongoose.Types.ObjectId(id)
    }));

    return foods[0] || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// USER API — GET /api/foods
// Returns all foods where isAvailable = true (stock > 0 AND availability true)
// ─────────────────────────────────────────────────────────────────────────────
const getFoods = async (req, res) => {
    try {
        const matchStage = {
            availability: true,
            stock:        { $gt: 0 }
        };

        const foods = await Food.aggregate(buildFoodPipeline(matchStage));

        return res.json({
            success: true,
            count:   foods.length,
            data:    foods
        });
    } catch (error) {
        console.error("getFoods error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ADMIN API - GET /api/admin/foods
// Returns every food item, including unavailable and out-of-stock records.
const getAllFoodsForAdmin = async (req, res) => {
    try {
        const foods = await Food.aggregate(buildFoodPipeline({}));

        return res.json({
            success: true,
            count: foods.length,
            data: foods
        });
    } catch (error) {
        console.error("getAllFoodsForAdmin error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// USER API — GET /api/foods/search?q=...
// Case-insensitive partial name / description search.
// Also filters to only available foods.
// ─────────────────────────────────────────────────────────────────────────────
const searchFoods = async (req, res) => {
    try {
        const q = (req.query.q || "").trim();

        if (!q) {
            return res.status(400).json({
                success: false,
                message: "Query parameter 'q' is required"
            });
        }

        const matchStage = {
            availability: true,
            stock:        { $gt: 0 },
            $or: [
                { name:        { $regex: q, $options: "i" } },
                { description: { $regex: q, $options: "i" } }
            ]
        };

        const foods = await Food.aggregate(buildFoodPipeline(matchStage));

        return res.json({
            success: true,
            query:   q,
            count:   foods.length,
            data:    foods
        });
    } catch (error) {
        console.error("searchFoods error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// USER API — GET /api/foods/category/:categoryId
// Filter available foods by category ObjectId.
// ─────────────────────────────────────────────────────────────────────────────
const getFoodsByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        // Accept both ObjectId and plain string (slug/name fallback)
        let matchStage = {
            availability: true,
            stock:        { $gt: 0 }
        };

        if (mongoose.Types.ObjectId.isValid(category)) {
            matchStage.category = new mongoose.Types.ObjectId(category);
        } else {
            // Treat it as a category name — resolve to ObjectId first
            const cat = await Category.findOne({ name: { $regex: `^${category}$`, $options: "i" } });
            if (!cat) {
                return res.json({ success: true, count: 0, data: [] });
            }
            matchStage.category = cat._id;
        }

        const foods = await Food.aggregate(buildFoodPipeline(matchStage));

        return res.json({
            success: true,
            count:   foods.length,
            data:    foods
        });
    } catch (error) {
        console.error("getFoodsByCategory error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// USER API — GET /api/foods/:id
// Returns full details of a single food item + rating stats.
// NOTE: this route MUST be registered AFTER /search and /category/:category
// to avoid Express treating "search" as an :id.
// ─────────────────────────────────────────────────────────────────────────────
const getFoodById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid food ID" });
        }

        const matchStage = { _id: new mongoose.Types.ObjectId(id) };
        const foods = await Food.aggregate(buildFoodPipeline(matchStage));

        if (!foods.length) {
            return res.status(404).json({ success: false, message: "Food not found" });
        }

        // Also fetch the latest 5 reviews for the detail page
        const recentReviews = await Rating.find({ food: id })
            .populate("user", "name")
            .sort({ createdAt: -1 })
            .limit(5)
            .select("rating review user createdAt");

        return res.json({
            success: true,
            data: {
                ...foods[0],
                recentReviews
            }
        });
    } catch (error) {
        console.error("getFoodById error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN API — GET /api/foods/categories  (kept for admin — returns distinct cats)
// ─────────────────────────────────────────────────────────────────────────────
const getCategories = async (req, res) => {
    try {
        const categories = await Food.aggregate([
            { $group: { _id: "$category" } },
            {
                $lookup: {
                    from:         "categories",
                    localField:   "_id",
                    foreignField: "_id",
                    as:           "categoryDetails"
                }
            },
            { $unwind: "$categoryDetails" },
            {
                $project: {
                    _id:  "$categoryDetails._id",
                    name: "$categoryDetails.name"
                }
            }
        ]);

        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN APIs — unchanged (kept exactly as before)
// ─────────────────────────────────────────────────────────────────────────────

const addFood = async (req, res) => {
    try {
        const { name, price, stock, image, category, description, availability } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({ message: "Name, price, and category are required" });
        }

        const categoryId = await resolveCategoryId(category);
        if (!categoryId) {
            return res.status(400).json({ message: "Valid category is required" });
        }

        const food = await Food.create({
            name,
            price,
            stock:        stock || 0,
            image,
            category:     categoryId,
            description:  description || "",
            availability: availability !== false
        });

        const populatedFood = await getFoodForAdminById(food._id);

        res.status(201).json({ message: "Food item created", data: populatedFood || food });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateFood = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, stock, image, category, description, availability } = req.body;

        let categoryId;
        if (category) {
            categoryId = await resolveCategoryId(category);
            if (!categoryId) {
                return res.status(400).json({ message: "Valid category is required" });
            }
        }

        const updates = { name, price, stock, image, description, availability };
        if (categoryId !== undefined) {
            updates.category = categoryId;
        }

        const food = await Food.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!food) {
            return res.status(404).json({ message: "Food not found" });
        }

        const populatedFood = await getFoodForAdminById(food._id);

        res.json({ message: "Food item updated", data: populatedFood || food });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteFood = async (req, res) => {
    try {
        const { id } = req.params;

        const food = await Food.findByIdAndDelete(id);

        if (!food) {
            return res.status(404).json({ message: "Food not found" });
        }

        res.json({ message: "Food item deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    // User-facing
    getFoods,
    getAllFoodsForAdmin,
    getFoodById,
    getFoodsByCategory,
    searchFoods,
    // Admin-facing
    addFood,
    updateFood,
    deleteFood,
    getCategories
};
