const express = require("express");
const router = express.Router();
const {
  sendRequestController,
  acceptRequestController,
  rejectRequestController,
  GetStudentBatchController,
  disconnectController
} = require("../Controllers/studentController");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Protected route for fetching students (so req.user is available)
router.get("/all-students", authMiddleware, GetStudentBatchController);

// ✅ Protected route for sending requests for connect
router.post("/send-request", authMiddleware, sendRequestController);

// ✅ Public routes for email confirmation
router.get("/accept-request/:token", acceptRequestController);
router.get("/reject-request/:token", rejectRequestController);

// for disconnect
router.post("/disconnect", authMiddleware, disconnectController);






module.exports = router;
