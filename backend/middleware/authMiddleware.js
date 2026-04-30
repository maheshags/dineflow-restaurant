const jwt  = require("jsonwebtoken");
const User = require("../models/User");

// ─────────────────────────────────────────────────────────────────────────────
// protect
// Verifies the Bearer JWT in the Authorization header.
// Populates req.user with the user document (password excluded).
// ─────────────────────────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ) {
        token = req.headers.authorization.split(" ")[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                return res.status(401).json({ success: false, message: "User not found" });
            }

            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: "Not authorized, token invalid" });
        }
    } else {
        return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// adminOnly
// Must be chained AFTER protect.
// Allows only users with role === "admin".
// ─────────────────────────────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Access denied. Admins only." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// userOnly
// Must be chained AFTER protect.
// Allows only users with role === "user".
// ─────────────────────────────────────────────────────────────────────────────
const userOnly = (req, res, next) => {
    if (req.user && req.user.role === "user") {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Access denied. Users only." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// deliveryOnly
// Must be chained AFTER protect.
// Allows only users with role === "delivery".
// ─────────────────────────────────────────────────────────────────────────────
const deliveryOnly = (req, res, next) => {
    if (req.user && req.user.role === "delivery") {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Access denied. Delivery agents only." });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// adminOrDelivery
// Convenience guard: allows both admin and delivery roles.
// ─────────────────────────────────────────────────────────────────────────────
const adminOrDelivery = (req, res, next) => {
    if (req.user && (req.user.role === "admin" || req.user.role === "delivery")) {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Access denied." });
    }
};

module.exports = { protect, adminOnly, userOnly, deliveryOnly, adminOrDelivery };