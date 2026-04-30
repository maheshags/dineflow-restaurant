const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"]
        },
        phone: {
            type: String,
            default: "",
            trim: true,
            unique: true,
            sparse: true
        },
        role: {
            type: String,
            enum: ["user", "admin", "delivery"],
            default: "user"
        },
        address: {
            type: String,
            default: "",
            trim: true
        },
        vehicle: {
            type: String,
            default: "",
            trim: true
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },
        totalDeliveries: {
            type: Number,
            default: 0,
            min: 0
        },
        rating: {
            type: Number,
            default: 4.5,
            min: 0,
            max: 5
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
