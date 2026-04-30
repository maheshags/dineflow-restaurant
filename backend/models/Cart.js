const mongoose = require("mongoose");

// ── Cart Item Sub-Schema ──────────────────────────────────────────────────────
const cartItemSchema = new mongoose.Schema(
    {
        food: {
            type:     mongoose.Schema.Types.ObjectId,
            ref:      "Food",
            required: [true, "Food reference is required"]
        },
        quantity: {
            type:     Number,
            required: [true, "Quantity is required"],
            min:      [1, "Quantity must be at least 1"]
        },
        // Snapshot of price at time of adding to cart.
        // Prevents price-change surprises during checkout.
        price: {
            type:     Number,
            required: [true, "Price snapshot is required"],
            min:      [0, "Price cannot be negative"]
        }
    },
    { _id: true }   // keep sub-doc _id for easy item-level operations
);

// ── Cart Schema ───────────────────────────────────────────────────────────────
const cartSchema = new mongoose.Schema(
    {
        user: {
            type:     mongoose.Schema.Types.ObjectId,
            ref:      "User",
            required: [true, "User reference is required"],
            unique:   true   // one cart per user, always
        },
        items: {
            type:    [cartItemSchema],
            default: []
        },
        // Denormalised total — recalculated on every write operation.
        totalAmount: {
            type:    Number,
            default: 0,
            min:     [0, "Total amount cannot be negative"]
        }
    },
    { timestamps: true }
);

// ── Instance method: recalculate totalAmount ──────────────────────────────────
// Call this after any mutation to items[], then save().
cartSchema.methods.recalculateTotal = function () {
    this.totalAmount = this.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
    // Round to 2 decimal places to avoid floating-point drift
    this.totalAmount = Math.round(this.totalAmount * 100) / 100;
};

module.exports = mongoose.model("Cart", cartSchema);
