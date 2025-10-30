const User = require("../Models/UserModel");
const Post = require("../Models/PostModel");
const Message = require("../Models/MessageModel");
const GalleryModel = require("../Models/GallaryModel");
const RequestModel = require("../Models/RequestModel");
const nodemailer = require("nodemailer");

// ✅ Dashboard Summary
exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalMessages = await Message.countDocuments();
    const allUsers = await User.find({}, "connections");
    const totalConnections = allUsers.reduce(
      (acc, user) => acc + (user.connections?.length || 0),
      0
    );

    res.json({
      success: true,
      data: { totalUsers, totalPosts, totalConnections, totalMessages },
    });
  } catch (error) {
    console.error("❌ Dashboard Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, "username usn batchYear email role userimg");
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("❌ Users Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ✅ Get Posts
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "username")
      .sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (error) {
    console.error("❌ Posts Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Connections
exports.getConnections = async (req, res) => {
  try {
    const connectionsData = await RequestModel.find({ status: "connected" })
      .populate("from", "username email usn batchYear userimg")
      .populate("to", "username email usn batchYear userimg");

    const userConnections = connectionsData.map((c) => ({
      fromUser: c.from,
      toUser: c.to,
      status: c.status,
    }));

    res.json({ success: true, connections: userConnections });
  } catch (error) {
    console.error("❌ Connections Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Profiles
exports.getProfiles = async (req, res) => {
  try {
    const profiles = await User.find({ role: "admin" }).select(
      "username email branch batchYear role userimg"
    );
    res.json({ success: true, profiles });
  } catch (error) {
    console.error("❌ Profiles Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Messages
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .populate("sender receiver", "username email");
    res.json({ success: true, messages });
  } catch (error) {
    console.error("❌ Messages Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Gallery
exports.getGallery = async (req, res) => {
  try {
    const gallery = await GalleryModel.find().sort({ createdAt: -1 });
    res.json({ success: true, gallery });
  } catch (error) {
    console.error("❌ Gallery Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Add Gallery Item
exports.PostGalleryController = async (req, res) => {
  try {
    const { title, description } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const newGallery = new GalleryModel({ title, description, image });
    await newGallery.save();
    res.json({ success: true, message: "Gallery item added successfully" });
  } catch (error) {
    console.error("❌ Gallery Upload Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Gallery Item
exports.UpdateGalleryController = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    // Debug check
    console.log("Update Request Body:", req.body);
    console.log("Update File:", req.file);

    const updateData = { title, description };

    if (req.file) {
      updateData.media = `/uploads/${req.file.filename}`;
    }

    const updated = await GalleryModel.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Gallery item not found" });
    }

    res.json({ success: true, message: "Gallery updated successfully", data: updated });
  } catch (error) {
    console.error("❌ Update Gallery Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ✅ Delete Gallery Item
exports.deleteGallery = async (req, res) => {
  try {
    const gallery = await GalleryModel.findById(req.params.id);
    if (!gallery)
      return res.status(404).json({ success: false, message: "Gallery not found" });
    await gallery.deleteOne();
    res.json({ success: true, message: "Gallery deleted successfully" });
  } catch (error) {
    console.error("❌ Delete Gallery Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Send Announcement / Message

// const User = require("../Models/UserModel");
// const Message = require("../Models/MessageModel");

exports.sendMessage = async (req, res) => {
  try {
    const { title, description, targetType, batchYear } = req.body;
    let recipients = [];

    // 🧭 Get recipient emails
    if (targetType === "all") {
      recipients = (await User.find({}, "email")).map((u) => u.email);
    } else if (targetType === "batch") {
      recipients = (await User.find({ batchYear }, "email")).map((u) => u.email);
    } else if (targetType === "custom") {
      recipients = JSON.parse(req.body.selectedEmails || "[]");
    }

    if (!recipients.length) {
      return res
        .status(400)
        .json({ success: false, message: "No recipients found" });
    }

    // 📸 Handle optional image
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    // 🗃️ Save to DB
    const message = new Message({
      title,
      description,
      image,
      targetType,
      batchYear,
      recipients,
      sentAt: new Date(),
    });

    await message.save();

    // 📧 Setup nodemailer transporter
    const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


    // 📬 Email sending content
    const mailOptions = {
      from: `"Alumni Portal" <${process.env.SMTP_USER}>`,
      subject: title,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2>${title}</h2>
          <p>${description}</p>
          ${
            image
              ? `<img src="${process.env.BASE_URL}${image}" alt="Message Image" width="400" />`
              : ""
          }
          <hr/>
          <p style="font-size:12px;color:#555">Sent via Alumni Portal</p>
        </div>
      `,
    };

    // 📨 Send emails one by one or in batches
    for (const email of recipients) {
      await transporter.sendMail({ ...mailOptions, to: email });
    }

    res.json({
      success: true,
      message: "Message sent successfully to recipients and saved in DB",
    });
  } catch (error) {
    console.error("❌ Send Message Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// ✅ Get Sent Messages
exports.getSentMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ sentAt: -1 });
    res.json({ success: true, sentMessages: messages });
  } catch (error) {
    console.error("❌ Get Sent Messages Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



 

// const Post = require("../Models/PostModel");
// const User = require("../Models/UserModel");

exports.createAdmiPost = async (req, res) => {
  try {
    const { title, description } = req.body;
    const media = req.file ? `/uploads/${req.file.filename}` : null;

    // ✅ Find an admin user to attach as post owner
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      return res.status(404).json({ success: false, message: "No admin user found" });
    }

    // ✅ Create the new post with required user field
    const newPost = new Post({
      title,
      description,
      postimg: media,
      user: adminUser._id, // fix: attach admin
    });

    await newPost.save();

    res.status(200).json({ success: true, message: "Post published successfully", post: newPost });
  } catch (err) {
    console.error("❌ Gallery create error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};




