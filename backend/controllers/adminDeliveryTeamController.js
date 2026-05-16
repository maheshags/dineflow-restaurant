const User    = require("../models/User");
const Order   = require("../models/Order");
const bcrypt  = require("bcryptjs");
const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────────────────────
// Active order statuses — delivery person cannot be deleted while holding these
// ─────────────────────────────────────────────────────────────────────────────
const ACTIVE_DELIVERY_STATUSES = ["assigned", "picked", "out_for_delivery"];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — safe delivery person object (no password)
// ─────────────────────────────────────────────────────────────────────────────
const safeDeliveryPerson = (user) => ({
    _id:       user._id,
    name:      user.name,
    email:     user.email,
    phone:     user.phone,
    role:      user.role,
    address:   user.address,
    vehicle:   user.vehicle,
    status:    user.status,
    totalDeliveries: user.totalDeliveries,
    rating:    user.rating,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/delivery-team
// Admin creates a delivery person account.
// role is ALWAYS forced to "delivery" — cannot be hijacked from request body.
// ─────────────────────────────────────────────────────────────────────────────
exports.createDeliveryPerson = async (req, res) => {
    try {
        const { name, email, password, phone, address, vehicle, status } = req.body;

        // ── Required field validation ─────────────────────────────────────────
        if (!name?.trim()) {
            return res.status(400).json({ success: false, message: "name is required" });
        }
        if (!email?.trim()) {
            return res.status(400).json({ success: false, message: "email is required" });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "password is required and must be at least 6 characters"
            });
        }
        if (!phone?.trim()) {
            return res.status(400).json({ success: false, message: "phone is required" });
        }

        // ── Duplicate email check ────────────────────────────────────────────
        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `Email "${email}" is already registered`
            });
        }

        const existingPhone = await User.findOne({ phone: phone.trim() });
        if (existingPhone) {
            return res.status(400).json({
                success: false,
                message: `Phone "${phone}" is already registered`
            });
        }

        // ── Hash password ─────────────────────────────────────────────────────
        const salt           = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // ── Create with role FORCED to "delivery" ─────────────────────────────
        const person = await User.create({
            name:     name.trim(),
            email:    email.toLowerCase().trim(),
            password: hashedPassword,
            phone:    phone.trim(),
            address:  address || "",
            vehicle:  vehicle || "",
            status:   status === "inactive" ? "inactive" : "active",
            role:     "delivery"   // hardcoded — no role escalation possible
        });

        return res.status(201).json({
            success: true,
            message: `Delivery person "${person.name}" created successfully`,
            data:    safeDeliveryPerson(person)
        });

    } catch (error) {
        console.error("createDeliveryPerson error:", error.message);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || "field";
            const value = error.keyValue?.[field] || "that value";
            return res.status(400).json({
                success: false,
                message: `${field} "${value}" is already registered`
            });
        }
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/delivery-team
// Returns all users with role === "delivery".
// Password field is never returned.
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllDeliveryPersons = async (req, res) => {
    try {
        const persons = await User.find({ role: "delivery" })
            .select("-password")
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            count:   persons.length,
            data:    persons
        });

    } catch (error) {
        console.error("getAllDeliveryPersons error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/delivery-team/:id
// Returns full profile of one delivery person.
// ─────────────────────────────────────────────────────────────────────────────
exports.getDeliveryPersonById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        const person = await User.findOne({ _id: id, role: "delivery" }).select("-password");

        if (!person) {
            return res.status(404).json({
                success: false,
                message: "Delivery person not found"
            });
        }

        // Also include their current active orders
        const activeOrders = await Order.find({
            assignedDeliveryPerson: id,
            orderStatus:            { $in: ACTIVE_DELIVERY_STATUSES }
        }).select("orderStatus customerDetails.name totalAmount placedAt");

        return res.json({
            success: true,
            data:    {
                ...person.toObject(),
                activeOrders,
                activeOrderCount: activeOrders.length
            }
        });

    } catch (error) {
        console.error("getDeliveryPersonById error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/delivery-team/:id
// Admin updates name, phone, email, address, or password.
// If password is provided, it is hashed before saving.
// role cannot be changed via this endpoint.
// ─────────────────────────────────────────────────────────────────────────────
exports.updateDeliveryPerson = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address, password, vehicle, status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        const person = await User.findOne({ _id: id, role: "delivery" });
        if (!person) {
            return res.status(404).json({
                success: false,
                message: "Delivery person not found"
            });
        }

        // ── Email uniqueness check (only if email is actually changing) ────────
        if (email && email.toLowerCase().trim() !== person.email) {
            const emailTaken = await User.findOne({ email: email.toLowerCase().trim() });
            if (emailTaken) {
                return res.status(400).json({
                    success: false,
                    message: `Email "${email}" is already in use`
                });
            }
            person.email = email.toLowerCase().trim();
        }

        // ── Apply updates ─────────────────────────────────────────────────────
        if (name?.trim())    person.name    = name.trim();
        if (phone !== undefined) person.phone = phone;
        if (address !== undefined) person.address = address;
        if (vehicle !== undefined) person.vehicle = vehicle;
        if (status !== undefined) person.status = status === "inactive" ? "inactive" : "active";

        // ── Hash new password if provided ──────────────────────────────────────
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "New password must be at least 6 characters"
                });
            }
            const salt = await bcrypt.genSalt(10);
            person.password = await bcrypt.hash(password, salt);
        }

        await person.save();

        return res.json({
            success: true,
            message: "Delivery person updated successfully",
            data:    safeDeliveryPerson(person)
        });

    } catch (error) {
        console.error("updateDeliveryPerson error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/delivery-team/:id
// Removes a delivery person permanently.
//
// Safety rule: CANNOT delete if the person has any ACTIVE orders.
// Active statuses: assigned, picked, out_for_delivery
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteDeliveryPerson = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }

        const person = await User.findOne({ _id: id, role: "delivery" });
        if (!person) {
            return res.status(404).json({
                success: false,
                message: "Delivery person not found"
            });
        }

        // ── Check for active orders ────────────────────────────────────────────
        const activeOrderCount = await Order.countDocuments({
            assignedDeliveryPerson: id,
            orderStatus:            { $in: ACTIVE_DELIVERY_STATUSES }
        });

        if (activeOrderCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete "${person.name}" — they have ${activeOrderCount} active order(s) (${ACTIVE_DELIVERY_STATUSES.join(", ")}). Reassign or complete those orders first.`
            });
        }

        await User.findByIdAndDelete(id);

        return res.json({
            success: true,
            message: `Delivery person "${person.name}" has been removed`
        });

    } catch (error) {
        console.error("deleteDeliveryPerson error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
