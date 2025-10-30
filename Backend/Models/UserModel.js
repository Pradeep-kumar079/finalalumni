// Models/UserModel.js
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const PostModel = require("./PostModel");

const DEFAULT_IMG = "/upload/degault.jpg";

const UserSchema = new mongoose.Schema(
  {
    userimg: { type: String, default: DEFAULT_IMG },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    otp: { type: Number },
    admissionyear: { type: Number },
    batchYear: { type: Number },
    branch: {
      type: String,
      enum: ["CSE", "ISE", "ECE", "EEE", "TELCOM", "CIVIL", "AI & ML"],
    },
    role: { type: String, enum: ["student", "alumni", "admin"], default: "student" },
    lateralEntry: { type: Boolean, default: false },
    mobileNo: { type: String },
    usn: { type: String },
    dob: { type: Date },
    isOnline: { type: Boolean, default: false },
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserModel" }],
  },
  { timestamps: true }
);

// 🧹 Middleware: Auto delete posts & images when a user is deleted
UserSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;

  try {
    console.log(`🧹 Deleting all posts for user: ${doc.username} (${doc._id})`);
    const posts = await PostModel.find({ user: doc._id });

    for (const post of posts) {
      if (post.postimg) {
        const imagePath = path.join(__dirname, "../uploads", post.postimg);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(` Deleted post image: ${imagePath}`);
        }
      }
      await PostModel.findByIdAndDelete(post._id);
    }

    // Optionally delete profile image if it's not the default one
    if (doc.userimg && doc.userimg !== DEFAULT_IMG) {
      const profilePath = path.join(__dirname, "../uploads", doc.userimg);
      if (fs.existsSync(profilePath)) {
        fs.unlinkSync(profilePath);
        console.log(` Deleted profile image: ${profilePath}`);
      }
    }

    console.log(`✅ Cleanup complete for user ${doc.username}`);
  } catch (err) {
    console.error("Error cleaning up user data:", err);
  }
});

module.exports = mongoose.model("UserModel", UserSchema);
