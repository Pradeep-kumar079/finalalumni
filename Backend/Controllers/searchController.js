const express = require("express")
const UserModel = require("../Models/UserModel")
const PostModel = require("../Models/PostModel")
const AllSearchcontroller = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, users: [], posts: [] });

    const regex = new RegExp(q, "i"); // case-insensitive match

    const users = await UserModel.find({
      $or: [{ username: regex }, { usn: regex }, { batch: regex }],
    }).select("_id username usn batch userimg role");

    const posts = await PostModel.find({
      $or: [{ title: regex }, { category: regex }, { hashtags: regex }],
    }).select("_id title category postimg");

    res.json({ success: true, users, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {AllSearchcontroller}