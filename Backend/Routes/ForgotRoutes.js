const express = require("express");
const router = express.Router();
const { forgotPassword, resetPassword } = require("../Controllers/forgotpassController");

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
