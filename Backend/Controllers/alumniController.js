const User = require("../Models/UserModel");
const Request = require("../Models/RequestModel");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const BASE_URL = process.env.BACKEND_URL || "http://localhost:5000";

/* ----------------------------
   GET ALUMNI BATCHES
----------------------------- */
const GetAlumniBatchController = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const alumniUsers = await User.find({ role: "alumni" }).lean();

    const requests = await Request.find({
      $or: [{ from: currentUserId }, { to: currentUserId }],
    });

    const batches = {};
    alumniUsers.forEach((user) => {
      const year = user.batchYear || "Unknown";
      if (!batches[year]) batches[year] = [];

      let requestStatus = "Not connected";
      if (user._id.toString() === currentUserId) requestStatus = "Myself";
      else {
        const connection = requests.find(
          (r) =>
            (r.from.toString() === currentUserId && r.to.toString() === user._id.toString()) ||
            (r.to.toString() === currentUserId && r.from.toString() === user._id.toString())
        );
        if (connection) {
          if (connection.status === "connected") requestStatus = "Connected";
          else if (connection.status === "pending") requestStatus = "Request Sent";
          else if (connection.status === "rejected") requestStatus = "Rejected";
        }
      }

      batches[year].push({ ...user, requestStatus });
    });

    const batchList = Object.keys(batches)
      .map((year) => ({ admissionyear: year, alumni: batches[year] }))
      .sort((a, b) => (a.admissionyear === "Unknown" ? 1 : Number(a.admissionyear) - Number(b.admissionyear)));

    res.json({ success: true, batches: batchList });
  } catch (err) {
    console.error("GetAlumniBatchController Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ----------------------------
   SEND CONNECTION REQUEST
----------------------------- */
const sendRequestController = async (req, res) => {
  try {
    const { email } = req.body;
    const fromUser = await User.findById(req.user.id);
    const toUser = await User.findOne({ email });

    if (!toUser) return res.status(404).json({ message: "Recipient not found" });
    if (toUser._id.toString() === fromUser._id.toString())
      return res.status(400).json({ message: "Cannot send request to yourself" });

    const existing = await Request.findOne({ from: fromUser._id, to: toUser._id });
    if (existing && existing.status === "pending")
      return res.json({ success: false, message: "Request already sent" });

    const token = crypto.randomBytes(32).toString("hex");

    await Request.create({
      from: fromUser._id,
      to: toUser._id,
      token,
      status: "pending",
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const acceptLink = `${BASE_URL}/api/alumni/accept-request/${token}`;
    const rejectLink = `${BASE_URL}/api/alumni/reject-request/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toUser.email,
      subject: "New Alumni Connection Request",
      html: `<div style="font-family:sans-serif;line-height:1.6;">
        <h2>New Connection Request</h2>
        <p><b>${fromUser.username}</b> wants to connect with you.</p>
        <p>
          <a href="${acceptLink}" style="padding:10px 20px;background:#28a745;color:#fff;text-decoration:none;border-radius:6px;margin-right:10px;">✅ Accept</a>
          <a href="${rejectLink}" style="padding:10px 20px;background:#dc3545;color:#fff;text-decoration:none;border-radius:6px;">❌ Reject</a>
        </p>
      </div>`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Connection request email sent!" });
  } catch (err) {
    console.error("Send Request Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ----------------------------
   ACCEPT CONNECTION REQUEST
----------------------------- */
const acceptRequestController = async (req, res) => {
  try {
    const { token } = req.params;
    const request = await Request.findOne({ token });
    if (!request)
      return res.status(404).json({ success: false, message: "Invalid or expired link" });

    request.status = "connected";
    await request.save();

    // reciprocal connection
    let reciprocal = await Request.findOne({ from: request.to, to: request.from });
    if (!reciprocal) {
      await Request.create({
        from: request.to,
        to: request.from,
        token: crypto.randomBytes(32).toString("hex"),
        status: "connected",
      });
    } else {
      reciprocal.status = "connected";
      await reciprocal.save();
    }

    await User.findByIdAndUpdate(request.from, { $addToSet: { connections: request.to } });
    await User.findByIdAndUpdate(request.to, { $addToSet: { connections: request.from } });

    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/accept-success`);
  } catch (err) {
    console.error("Accept Request Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ----------------------------
   REJECT CONNECTION REQUEST
----------------------------- */
const rejectRequestController = async (req, res) => {
  try {
    const { token } = req.params;
    const request = await Request.findOne({ token });
    if (!request) return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/accept-failed`);

    request.status = "rejected";
    await request.save();
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/accept-failed`);
  } catch (err) {
    console.error("Reject Request Error:", err);
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/accept-failed`);
  }
};

/* ----------------------------
   DISCONNECT CONTROLLER
----------------------------- */
const disconnectController = async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user.id;

    await User.findByIdAndUpdate(currentUserId, { $pull: { connections: userId } });
    await User.findByIdAndUpdate(userId, { $pull: { connections: currentUserId } });

    await Request.updateMany(
      {
        $or: [
          { from: currentUserId, to: userId },
          { from: userId, to: currentUserId },
        ],
      },
      { $set: { status: "not connected" } }
    );

    res.json({ success: true, message: "Disconnected successfully" });
  } catch (err) {
    console.error("Disconnect Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


module.exports = {
  GetAlumniBatchController,
  sendRequestController,
  acceptRequestController,
  rejectRequestController,
  disconnectController,
  
};
