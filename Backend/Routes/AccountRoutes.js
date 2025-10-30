const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const upload = require("../multerconfig");

const {
  GetUser,
  EditProfileController,
  MyPostsController,
} = require("../Controllers/accountController");

// Get current user details using token
router.get("/", verifyToken, GetUser);

// Edit user profile
router.put("/update", verifyToken, upload.single("userimg"), EditProfileController);

// Get all posts of user
router.get("/posts/me", verifyToken, MyPostsController);

module.exports = router;
