const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  postimg: { type: String, required: false },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  date: { type: Date, default: Date.now },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
    },
  ],
  comments: [
    {
      text: String,
      username: String,
      user: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel" },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  category: { type: String },
  reports: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel" },
      reason: { type: String },
      reportedAt: { type: Date, default: Date.now },
    },
  ],
  hashtags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PostModel", postSchema);
