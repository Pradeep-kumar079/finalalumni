const express = require("express");
const router = express.Router();
const {
  GetAlumniBatchController,
  sendRequestController,
  acceptRequestController,
  rejectRequestController,
  disconnectController
} = require("../Controllers/alumniController");
const authMiddleware = require("../middleware/authMiddleware");

// Fetch all alumni grouped by batch
router.get("/all-alumni", authMiddleware, GetAlumniBatchController);

// Send connection request
router.post("/send-request", authMiddleware, sendRequestController);

// Accept/Reject request via email link
router.get("/accept-request/:token", acceptRequestController);
router.get("/reject-request/:token", rejectRequestController);

// Disconnect
router.post("/disconnect", authMiddleware, disconnectController);

module.exports = router;
