const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  getDashboard,
  getUsers,
  getPosts,
  getConnections,
  getProfiles,
  getMessages,
  getGallery,
  PostGalleryController,
  UpdateGalleryController,
  deleteGallery,
  sendMessage,
  getSentMessages,
  createAdmiPost
} = require("../Controllers/adminController");

const User = require("../Models/UserModel");
const Post = require("../Models/PostModel");
 
const upload = require("../multerconfig");

// ✅ Admin routes
router.get("/dashboard", getDashboard);
router.get("/users", getUsers);
router.get("/posts", getPosts);
router.get("/connections", getConnections);
router.get("/profiles", getProfiles);
router.get("/messages", getMessages);
router.get("/gallery", getGallery);

// ✅ Gallery CRUD
router.post("/gallery", upload.single("image"), PostGalleryController);
router.put("/gallery/:id", upload.single("image"), UpdateGalleryController);
router.delete("/gallery/:id", deleteGallery);

// ✅ Admin Announcements / Messages
router.post("/send-message", upload.single("image"), sendMessage);
router.get("/sentmessages", getSentMessages);

router.post("/create", upload.single("image"),  createAdmiPost);



// get single gallery view
router.get("/gallery/:id", async (req, res) => {
  try {
    const item = await GalleryModel.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ Delete user
router.delete("/delete-user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });
    if (user.role === "admin")
      return res.status(403).json({ success: false, message: "Cannot delete admin" });

    await user.deleteOne();
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("❌ Delete User Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Delete post
router.delete("/delete-post/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res.status(404).json({ success: false, message: "Post not found" });

    await post.deleteOne();
    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("❌ Delete Post Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
