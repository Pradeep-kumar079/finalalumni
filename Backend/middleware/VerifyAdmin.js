const jwt = require("jsonwebtoken");

const verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader)
      return res.status(401).json({ success: false, message: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "Invalid token format" });

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check admin role
    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied: Admins only" });
    }

    req.user = decoded; // store decoded info in req.user
    next();
  } catch (err) {
    console.error("Admin verification failed:", err.message);
    return res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = verifyAdmin;
