import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectRoute = async (req, res, next) => {
  // 1. Get token from header or cookies
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  // 2. Verify token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized (no token)"
    });
  }

  // 3. Verify token validity
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Check if user still exists
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists"
      });
    }

    // 5. Grant access
    req.user = currentUser;
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    
    let message = "Not authorized";
    if (error.name === "TokenExpiredError") message = "Token expired";
    if (error.name === "JsonWebTokenError") message = "Invalid token";

    res.status(401).json({
      success: false,
      message
    });
  }
};