const mongoose = require("mongoose");

// ── Customer details sub-schema ───────────────────────────────────────────────
// Captured at order-time so we have a permanent record even if the user
// edits their profile later.
const customerDetailsSchema = new mongoose.Schema(
    {
        name: {
            type:    String,
            required: [true, "Customer name is required"],
            trim:    true
        },
        phone: {
            type:    String,
            required: [true, "Customer phone is required"],
            trim:    true
        },
        location: {
            type:  String,
            default: "",
            trim:  true
        },
        address: {
            type:  String,
            required: [true, "Delivery address is required"],
            trim:  true
        },
        instructions: {
            type:  String,
            default: "",
            trim:  true
        }
    },
    { _id: false }   // embedded object, not a separate document
);

// ── Order item sub-schema ─────────────────────────────────────────────────────
// Snapshots food name, price, and image at order-time so the order record
// stays accurate even if the food is later updated or deleted.
const orderItemSchema = new mongoose.Schema(
    {
        food: {
            type: mongoose.Schema.Types.ObjectId,
            ref:  "Food",
            required: [true, "Food reference is required"]
        },
        name: {
            type:    String,
            required: [true, "Food name snapshot is required"],
            trim:    true
        },
        price: {
            type:    Number,
            required: [true, "Food price snapshot is required"],
            min:     [0, "Price cannot be negative"]
        },
        quantity: {
            type:    Number,
            required: [true, "Quantity is required"],
            min:     [1, "Quantity must be at least 1"]
        },
        image: {
            type:    String,
            default: ""
        }
    },
    { _id: true }
);

// ── Main Order schema ──────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
    {
        // ── Who placed the order ──────────────────────────────────────────────
        user: {
            type:     mongoose.Schema.Types.ObjectId,
            ref:      "User",
            required: [true, "User reference is required"]
        },

        // ── Delivery destination ──────────────────────────────────────────────
        customerDetails: {
            type:     customerDetailsSchema,
            required: [true, "Customer details are required"]
        },

        // ── What was ordered ──────────────────────────────────────────────────
        items: {
            type:     [orderItemSchema],
            validate: {
                validator: (arr) => arr.length > 0,
                message:   "Order must have at least one item"
            }
        },

        // ── Financials ────────────────────────────────────────────────────────
        // totalAmount  — canonical field going forward
        // totalPrice   — kept as alias so existing admin aggregations still work
        totalAmount: {
            type:    Number,
            required: [true, "Total amount is required"],
            min:     [0, "Total amount cannot be negative"]
        },

        // ── Payment ───────────────────────────────────────────────────────────
        paymentMethod: {
            type:    String,
            enum:    ["cash", "upi"],
            default: "cash"
        },
        paymentStatus: {
            type:    String,
            enum:    ["pending", "paid", "failed"],
            default: "pending"
        },

        // ── Order lifecycle ───────────────────────────────────────────────────
        // orderStatus  — new granular field
        // status       — kept as alias so existing admin aggregations still work
        orderStatus: {
            type:    String,
            enum:    [
                "pending",          // waiting for admin acceptance
                "accepted",         // admin accepted the order
                "preparing",        // kitchen is preparing
                "ready",            // ready for pickup / delivery
                "assigned",         // assigned to a delivery person
                "picked",           // delivery person picked it up
                "out_for_delivery", // en-route to customer
                "delivered",        // successfully delivered
                "cancelled"         // cancelled (by user or admin)
            ],
            default: "pending"
        },

        // ── Delivery assignment ───────────────────────────────────────────────
        assignedDeliveryPerson: {
            type:    mongoose.Schema.Types.ObjectId,
            ref:     "User",
            default: null
        },

        // ── Timestamps for key events ─────────────────────────────────────────
        placedAt: {
            type:    Date,
            default: Date.now
        },
        deliveredAt: {
            type:    Date,
            default: null
        }
    },
    { timestamps: true }   // createdAt + updatedAt managed by Mongoose
);

// ── Virtual aliases (backward-compat reads) ───────────────────────────────────
// adminController aggregations reference "$totalPrice" and "$status".
// These virtuals make those names resolve correctly when documents are
// serialised to JSON / plain objects.
orderSchema.virtual("totalPrice").get(function () {
    return this.totalAmount;
});

orderSchema.virtual("status").get(function () {
    return this.orderStatus;
});

// Enable virtuals in JSON and plain-object output
orderSchema.set("toJSON",   { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

// ── Index for common query patterns ──────────────────────────────────────────
orderSchema.index({ user: 1, createdAt: -1 });          // "my orders" page
orderSchema.index({ orderStatus: 1, createdAt: -1 });   // admin order list
orderSchema.index({ assignedDeliveryPerson: 1 });       // delivery app

module.exports = mongoose.model("Order", orderSchema);