const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Food name is required"],
            trim: true
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price cannot be negative"]
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Category is required"]
        },
        stock: {
            type: Number,
            required: true,
            default: 0,
            min: [0, "Stock cannot be negative"]
        },
        image: {
            type: String,
            default: ""
        },
        description: {
            type: String,
            default: "",
            trim: true
        },
        // Admin can manually disable a food even if stock exists
        availability: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        toJSON:   { virtuals: true },
        toObject: { virtuals: true }
    }
);

// ── Virtual: isAvailable ──────────────────────────────────────────────────────
// true  → food is in stock AND admin has not disabled it
// false → out of stock OR manually disabled
foodSchema.virtual("isAvailable").get(function () {
    return this.availability === true && this.stock > 0;
});

// ── Index for fast name search ────────────────────────────────────────────────
foodSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Food", foodSchema);