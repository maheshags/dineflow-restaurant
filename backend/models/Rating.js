const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        food: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Food",
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

ratingSchema.index({ user: 1, food: 1 }, { unique: true });

module.exports = mongoose.model("Rating", ratingSchema);