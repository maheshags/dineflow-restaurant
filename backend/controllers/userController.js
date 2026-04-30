const User = require("../models/User");
const Order = require("../models/Order");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || "user"
        });

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "Registration successful",
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// LOGIN
exports.loginUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // 🔥 CHECK ROLE MATCH
        if (role && user.role !== role) {
            return res.status(403).json({
                message: `You are not registered as ${role}`
            });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ✅ GET USERS (IMPORTANT)
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/user/profile
// Return logged-in user details
// ─────────────────────────────────────────────────────────────────────────────
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password -__v");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.json({ success: true, data: user });
    } catch (error) {
        console.error("getUserProfile error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/user/profile
// User updates their name, phone, address
// ─────────────────────────────────────────────────────────────────────────────
exports.updateUserProfile = async (req, res) => {
    try {
        const { name, phone, address } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (address !== undefined) user.address = address;

        const updatedUser = await user.save();

        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        return res.json({
            success: true,
            message: "Profile updated successfully",
            data: userResponse
        });
    } catch (error) {
        console.error("updateUserProfile error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/user/change-password
// Change user password
// ─────────────────────────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword || newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: "Old password and new password (min 6 chars) are required" 
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect old password" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        return res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        console.error("changePassword error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/user/dashboard
// Return user summary
// ─────────────────────────────────────────────────────────────────────────────
exports.getUserDashboard = async (req, res) => {
    try {
        const userId = req.user._id;

        const orders = await Order.find({ user: userId });

        let totalOrders = orders.length;
        let deliveredOrders = 0;
        let cancelledOrders = 0;
        let pendingOrders = 0;
        let totalSpent = 0;

        orders.forEach((o) => {
            if (o.orderStatus === "delivered") {
                deliveredOrders++;
                totalSpent += o.totalAmount;
            } else if (o.orderStatus === "cancelled") {
                cancelledOrders++;
            } else {
                pendingOrders++;
            }
        });

        // Get 5 recent orders
        const recentOrders = await Order.find({ user: userId })
            .select("items totalAmount orderStatus paymentStatus placedAt")
            .sort({ createdAt: -1 })
            .limit(5);

        // Calculate favorite foods (based on quantity ordered in delivered orders)
        const favoriteFoods = await Order.aggregate([
            { $match: { user: userId, orderStatus: "delivered" } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.food",
                    name: { $first: "$items.name" },
                    image: { $first: "$items.image" },
                    totalQuantity: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 4 } // Top 4
        ]);

        return res.json({
            success: true,
            message: "User dashboard loaded",
            data: {
                totalOrders,
                deliveredOrders,
                pendingOrders,
                cancelledOrders,
                totalSpent,
                recentOrders,
                favoriteFoods
            }
        });
    } catch (error) {
        console.error("getUserDashboard error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};