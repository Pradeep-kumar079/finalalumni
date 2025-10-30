const UserModel = require("../Models/UserModel");
const OtpModel = require("../Models/OtpModel");
const PostModel = require("../Models/PostModel");
const BatchModel = require("../Models/BatchModel");
const FeedBackModel = require("../Models/FeedBackform");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");

// --- SEND OTP ---
const sendOtpController = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: "Email is required" });

    const existingUser = await UserModel.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, message: "User already registered with this email." });

    const otp = Math.floor(100000 + Math.random() * 900000);

    await OtpModel.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Alumni Registration",
      text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
    });

    res.status(200).json({ success: true, message: "OTP sent successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to send OTP", error: err.message });
  }
};

// --- VERIFY OTP ---
const verifyOtpController = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: "Email and OTP are required" });

    const record = await OtpModel.findOne({ email, otp });
    if (!record)
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

    await OtpModel.deleteOne({ email });
    res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- REGISTER ---
const RegisterController = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      branch,
      admissionyear,
      lateralEntry = false,
      mobileNo,
      usn,
      dob
    } = req.body;
    const img = "../uploads/default.jpg";

    if (!username || !email || !password || !branch || !admissionyear)
      return res.status(400).json({ success: false, message: "All fields are required" });

    const existingUser = await UserModel.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, message: "User already exists" });

    const currentYear = new Date().getFullYear();
    const courseDuration = lateralEntry ? 3 : 4;

    // Determine role
    const role = admissionyear + courseDuration <= currentYear ? "alumni" : "student";

    // Determine real batch year for lateral entry
    const batchYear = lateralEntry ? admissionyear - 1 : admissionyear;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserModel({
      userimg: img,
      username,
      email,
      password: hashedPassword,
      branch,
      admissionyear,
      batchYear,
      lateralEntry,
      role,
      mobileNo,
      usn,
      dob,
    });

    const savedUser = await newUser.save();

    // --- BATCH LOGIC ---
    let batch = await BatchModel.findOne({ admissionyear: batchYear });
    if (!batch) {
      batch = new BatchModel({
        admissionyear: batchYear,
        branches: [branch],
        role: [savedUser._id],
      });
    } else {
      if (!batch.branches.includes(branch)) batch.branches.push(branch);
      if (!batch.role.includes(savedUser._id)) batch.role.push(savedUser._id);
    }
    await batch.save();

    res.status(201).json({ success: true, message: "User registered successfully", user: savedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- LOGIN ---
 
const LoginController = async (req, res) => {
  try {
    const { usn, password } = req.body;
    if (!usn || !password)
      return res.status(400).json({ success: false, message: "All fields required" });

    const user = await UserModel.findOne({ usn: usn.toUpperCase() });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // ✅ Send user + token properly
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: user,
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

 


// --- POST CONTROLLERS (No changes needed) ---
const PostController = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const { title, description, tags } = req.body;
    const newPost = new PostModel({
      title,
      description,
      postimg: req.file ? req.file.filename : null,
      hashtags: tags ? tags.split(",").map(tag => tag.trim()) : [],
      user: req.user.id,
    });
    await newPost.save();
    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const allPostsController = async (req, res) => {
  try {
    const posts = await PostModel.find()
      .populate("user", "username email userimg")
      .populate("likes", "username")
      .exec();
    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.log("Fetch Posts Error:", error);
    res.status(500).json({ success: false, message: "Error fetching posts" });
  }
};

const GetSinglePost = async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id).populate("user");
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const FetchLikes = async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    const userId = req.user.id;
    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }
    await post.save();
    res.json({ success: true, updatedLikes: post.likes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const FetchComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!comment?.trim()) return res.status(400).json({ success: false, message: "Comment cannot be empty" });

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const PERSPECTIVE_API_KEY = process.env.PERSPECTIVE_API_KEY;
    let toxicity = 0;
    try {
      const analyzeRes = await axios.post(
        `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${PERSPECTIVE_API_KEY}`,
        { comment: { text: comment }, languages: ["en"], requestedAttributes: { TOXICITY: {} } }
      );
      toxicity = analyzeRes.data.attributeScores.TOXICITY.summaryScore.value;
    } catch (apiErr) {
      console.error("Perspective API failed:", apiErr.message);
      toxicity = 0;
    }
    if (toxicity > 0.6) return res.status(400).json({ success: false, message: "Comment rejected due to inappropriate language." });

    const post = await PostModel.findById(id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    post.comments.push({ text: comment.trim(), user: userId, username: user.username, createdAt: new Date() });
    await post.save();
    res.json({ success: true, updatedComments: post.comments });
  } catch (err) {
    console.error("FetchComments error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await UserModel.findById(userId).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const posts = await PostModel.find({ user: userId }).sort({ createdAt: -1 }).populate("user", "username userimg");
    res.status(200).json({ success: true, user, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// get connection list
// ✅ Get user details and their connections
const getUserConnections = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId)
      return res.status(400).json({ success: false, message: "User ID missing" });

    const user = await UserModel.findById(userId).select("-password");
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const connections = await UserModel.find({
      _id: { $in: user.connections || [] },
    }).select("username userimg email usn");

    return res.status(200).json({
      success: true,
      user,
      connections,
    });
  } catch (error) {
    console.error("Error fetching user connections:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//user profile
const GetUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select("-password");
    console.log(user);
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// feedback controller
const FeedbackController = async (req, res) => {
  try {
    const newFeedback = new FeedBackModel({
      username: req.user.id,
      feedback: req.body.feedback,
    });

    await newFeedback.save();
    res.json({ success: true, message: "Feedback submitted successfully" });
  } catch (err) {
    console.error("Feedback Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};





module.exports = {
  RegisterController,
  sendOtpController,
  verifyOtpController,
  LoginController,
  PostController,
  allPostsController,
  GetSinglePost,
  FetchLikes,
  FetchComments,
  getUserProfile,
  getUserConnections,
  GetUser,
  FeedbackController
};

