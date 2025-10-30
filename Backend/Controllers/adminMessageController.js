// // Controllers/adminMessageController.js
// const AnnouncementModel = require("../Models/AnnouncementModel");
// const UserModel = require("../Models/UserModel");
// const nodemailer = require("nodemailer");

// const createTransporter = () => {
//   return nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: parseInt(process.env.EMAIL_PORT || "587"),
//     secure: process.env.EMAIL_SECURE === "true",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });
// };

// const sendMessage = async (req, res) => {
//   try {
//     const { title, description, targetType = "all", batchYear, selectedEmails } = req.body;
//     const recipients = [];

//     if (targetType === "all") {
//       const users = await UserModel.find().select("email");
//       users.forEach((u) => u.email && recipients.push(u.email));
//     } else if (targetType === "batch") {
//       const users = await UserModel.find({ batchYear: +batchYear }).select("email");
//       users.forEach((u) => u.email && recipients.push(u.email));
//     } else if (targetType === "custom" && selectedEmails) {
//       // expecting JSON array or CSV string
//       const arr = typeof selectedEmails === "string" ? JSON.parse(selectedEmails) : selectedEmails;
//       arr.forEach((e) => e && recipients.push(e));
//     }

//     // store announcement (optional)
//     const announcement = await AnnouncementModel.create({
//       title,
//       content: description,
//       targetType,
//       batchYear,
//       recipients,
//       createdBy: req.user.id,
//       image: req.file ? req.file.filename : undefined,
//     });

//     // send email (batch in chunks to avoid too-large emails)
//     const transporter = createTransporter();
//     const subject = title;
//     const text = description;

//     // send in small batches
//     const chunkSize = 50;
//     for (let i = 0; i < recipients.length; i += chunkSize) {
//       const chunk = recipients.slice(i, i + chunkSize);
//       const info = await transporter.sendMail({
//         from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
//         to: chunk.join(","),
//         subject,
//         text,
//         // if you want HTML:
//         html: `<p>${description}</p>`,
//       });
//       console.log("Emails sent:", info.messageId);
//     }

//     res.json({ success: true, message: "Message queued/sent", announcement });
//   } catch (err) {
//     console.error("Send Message Error:", err);
//     res.status(500).json({ success: false, message: "Failed to send message" });
//   }
// };

// const getSentMessages = async (req, res) => {
//   try {
//     const messages = await AnnouncementModel.find().sort({ sentAt: -1 });
//     res.json({ success: true, messages });
//   } catch (err) {
//     console.error("Get Sent Messages Error:", err);
//     res.status(500).json({ success: false, message: "Error fetching messages" });
//   }
// };

// module.exports = { sendMessage, getSentMessages };
