// Routes/AdminAnnouncementRoutes.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const verifyAdmin = require("../middleware/VerifyAdmin");

const {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../Controllers/adminAnnouncementController");

// CRUD for announcements
router.post("/", verifyToken, verifyAdmin, createAnnouncement);
router.get("/", verifyToken, verifyAdmin, getAnnouncements);
router.put("/:id", verifyToken, verifyAdmin, updateAnnouncement);
router.delete("/:id", verifyToken, verifyAdmin, deleteAnnouncement);

module.exports = router;
