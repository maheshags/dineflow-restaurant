const Rating = require("../models/Rating");
const Food   = require("../models/Food");
const Order  = require("../models/Order");
const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ratings
// User submits or updates a rating for a food item.
//
// Rules:
//  1. User must be logged in (via protect middleware).
//  2. User must have ordered this food item before.
//  3. The order must be in "delivered" status.
//  4. Rating must be 1-5.
//  5. One user can only have one rating per food (Upsert logic).
// ─────────────────────────────────────────────────────────────────────────────
exports.addOrUpdateRating = async (req, res) => {
    try {
        const { foodId, rating, comment } = req.body;

        // ── Step 1: Basic validation ──────────────────────────────────────────
        if (!foodId || !mongoose.Types.ObjectId.isValid(foodId)) {
            return res.status(400).json({ success: false, message: "Valid foodId is required" });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
        }

        // ── Step 2: Check if food exists ──────────────────────────────────────
        const food = await Food.findById(foodId);
        if (!food) {
            return res.status(404).json({ success: false, message: "Food item not found" });
        }

        // ── Step 3: Check if user has a DELIVERED order for this food ─────────
        // We look for an order where:
        //   - user matches req.user._id
        //   - orderStatus is "delivered"
        //   - items array contains an item with food matching foodId
        const hasOrdered = await Order.findOne({
            user: req.user._id,
            orderStatus: "delivered",
            "items.food": foodId
        });

        if (!hasOrdered) {
            return res.status(403).json({
                success: false,
                message: "You can only rate food items that have been delivered to you."
            });
        }

        // ── Step 4: Upsert rating ─────────────────────────────────────────────
        const existingRating = await Rating.findOne({ user: req.user._id, food: foodId });
        
        const updatedRating = await Rating.findOneAndUpdate(
            { user: req.user._id, food: foodId },
            { 
                rating, 
                comment: comment || ""
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return res.status(existingRating ? 200 : 201).json({
            success: true,
            message: existingRating ? "Rating updated successfully" : "Rating submitted successfully",
            data: updatedRating
        });

    } catch (error) {
        console.error("addOrUpdateRating error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ratings/food/:foodId
// Returns all ratings for a specific food item.
// ─────────────────────────────────────────────────────────────────────────────
exports.getFoodRatings = async (req, res) => {
    try {
        const { foodId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(foodId)) {
            return res.status(400).json({ success: false, message: "Invalid food ID" });
        }

        const ratings = await Rating.find({ food: foodId })
            .populate("user", "name")
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            count: ratings.length,
            data: ratings
        });

    } catch (error) {
        console.error("getFoodRatings error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN API — GET /api/ratings
// Returns all ratings across the platform.
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllRatings = async (req, res) => {
    try {
        const ratings = await Rating.find()
            .populate("user", "name email")
            .populate("food", "name price")
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            count: ratings.length,
            data: ratings
        });
    } catch (error) {
        console.error("getAllRatings error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};