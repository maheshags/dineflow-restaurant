const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ─── Helper: generate JWT ─────────────────────────────────────────────────────
const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// ─── Helper: safe user object (no password) ──────────────────────────────────
const safeUser = (user) => ({
    _id:     user._id,
    name:    user.name,
    email:   user.email,
    phone:   user.phone,
    role:    user.role,
    address: user.address,
    vehicle: user.vehicle,
    status:  user.status,
    totalDeliveries: user.totalDeliveries,
    rating:  user.rating,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Public — creates a normal "user" account only.
// Admin and delivery roles CANNOT be created from this endpoint.
// ─────────────────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;

        // ── Validate required fields ──────────────────────────────────────────
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        // ── Duplicate email check ─────────────────────────────────────────────
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        // ── Hash password ─────────────────────────────────────────────────────
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // ── Create user — role is ALWAYS "user" from public signup ────────────
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            phone:    phone   || "",
            address:  address || "",
            role:     "user"      // hardcoded — no role escalation possible
        });

        const token = generateToken(user._id);

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user: safeUser(user)
        });

    } catch (error) {
        console.error("Register error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Public — works for ALL roles (user / admin / delivery).
// Optionally accepts a `role` in body to restrict login to a specific portal.
// ─────────────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // ── Validate required fields ──────────────────────────────────────────
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // ── Find user ─────────────────────────────────────────────────────────
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // ── Verify password ───────────────────────────────────────────────────
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // ── Optional role gate (e.g. admin portal sends role:"admin") ─────────
        if (role && user.role !== role) {
            return res.status(403).json({
                success: false,
                message: `Access denied. This account is not registered as ${role}`
            });
        }

        const token = generateToken(user._id);

        return res.json({
            success: true,
            message: "Login successful",
            token,
            user: safeUser(user)
        });

    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// POST /api/auth/delivery-login
// Delivery portal login by phone number + password.
exports.deliveryLogin = async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                message: "Phone and password are required"
            });
        }

        const user = await User.findOne({
            phone: phone.trim(),
            role: "delivery"
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid phone or password"
            });
        }

        if (user.status === "inactive") {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive. Contact admin."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid phone or password"
            });
        }

        const token = generateToken(user._id);

        return res.json({
            success: true,
            message: "Login successful",
            token,
            user: safeUser(user)
        });
    } catch (error) {
        console.error("Delivery login error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// Protected — returns the logged-in user's profile.
// ─────────────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
    try {
        // req.user is set by the `protect` middleware (no password field)
        const user = await User.findById(req.user._id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error("GetMe error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/send-otp
// FAKE Development implementation — does not actual send an SMS, just returns success.
// ─────────────────────────────────────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        
        if (!phone) {
            return res.status(400).json({ success: false, message: "Phone number is required" });
        }

        // FAKE OTP response
        return res.json({ 
            success: true, 
            message: "OTP sent successfully (Development: Use 1234)" 
        });

    } catch (error) {
        console.error("sendOtp error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// FAKE Development implementation — matches against "1234" ONLY.
// Dynamically creates a new user via phone if none exist.
// ─────────────────────────────────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
    try {
        const { phone, otp, name } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: "Phone and OTP are required" });
        }

        // FAKE verify logic
        if (otp !== "1234") {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        // Check if user exists by phone
        let user = await User.findOne({ phone });

        // If not, auto-create a user using dummy email and password
        if (!user) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("auto_pass_" + Date.now(), salt);
            
            // Clean phone number for display name fallback
            const phoneDigits = phone.replace(/\D/g, "");
            const nameSuffix = phoneDigits.slice(-4) || "User";

            user = await User.create({
                name:     name || ("User " + nameSuffix),
                email:    `user${Date.now()}@example.com`,
                password: hashedPassword,
                phone:    phone,
                role:     "user"
            });
        } else {
            // If existing user has no name and name is provided, update name
            if (name && (!user.name || user.name.startsWith("User "))) {
                user.name = name;
                await user.save();
            }
        }

        const token = generateToken(user._id);

        return res.json({
            success: true,
            message: "Login successful",
            token,
            user: safeUser(user)
        });

    } catch (error) {
        console.error("verifyOtp error:", error.message);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
