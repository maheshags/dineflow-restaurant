const express = require("express");
const router  = express.Router();

const {
    createDeliveryPerson,
    getAllDeliveryPersons,
    getDeliveryPersonById,
    updateDeliveryPerson,
    deleteDeliveryPerson
} = require("../controllers/adminDeliveryTeamController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// All routes are admin-only
// ─────────────────────────────────────────────────────────────────────────────

// POST   /api/admin/delivery-team         — create delivery person
router.post("/",    protect, adminOnly, createDeliveryPerson);

// GET    /api/admin/delivery-team         — list all delivery persons
router.get("/",     protect, adminOnly, getAllDeliveryPersons);

// GET    /api/admin/delivery-team/:id     — get one delivery person
// ⚠️  Must be after "/" routes to avoid route-shadowing issues
router.get("/:id",  protect, adminOnly, getDeliveryPersonById);

// PUT    /api/admin/delivery-team/:id     — update delivery person
router.put("/:id",  protect, adminOnly, updateDeliveryPerson);

// DELETE /api/admin/delivery-team/:id     — delete (blocked if active orders exist)
router.delete("/:id", protect, adminOnly, deleteDeliveryPerson);

module.exports = router;
