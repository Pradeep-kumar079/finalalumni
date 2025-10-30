const User = require("../Models/UserModel");
const PostModel = require("../Models/PostModel");
const bcrypt = require("bcrypt");

// ✅ Get logged-in user
const GetUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Edit profile
const EditProfileController = async (req, res) => {
  try {
    const userId = req.user.id;
    let updateData = { ...req.body };

    console.log("🟢 Update request received:");
    console.log("Body:", req.body);
    console.log("File:", req.file);

    // 🧹 Remove fields we don't want to update
    const blockedFields = [
      "_id",
      "connections",
      "createdAt",
      "updatedAt",
      "__v",
      "usn",
      "role",
    ];
    blockedFields.forEach((field) => delete updateData[field]);

    // ✅ If password change
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // ✅ Handle uploaded image
    if (req.file) {
      updateData.userimg = req.file.path.replace(/\\/g, "/"); // normalize slashes
    }

    // ✅ Update user
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser)
      return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    console.error("❌ Profile update error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Fetch user’s posts
const MyPostsController = async (req, res) => {
  try {
    const posts = await PostModel.find({ user: req.user.id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, posts });
  } catch (err) {
    console.error("❌ Fetch posts error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};



module.exports = { GetUser, EditProfileController, MyPostsController };
