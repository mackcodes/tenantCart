import jwt from "jsonwebtoken";

import User from "../models/User.js";

export const protect = async (
  req,
  res,
  next
) => {
  try {
    const cookieToken =
      req.cookies?.tenantcart_token;

    const headerToken =
      req.headers.authorization?.startsWith(
        "Bearer "
      )
        ? req.headers.authorization.split(" ")[1]
        : null;

    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({
        message: "Not authorized, no token",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id)
      .select("-passwordHash")
      .populate("tenant");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    if (
      user.passwordChangedAt &&
      decoded.iat
    ) {
      const passwordChangedTimestamp =
        Math.floor(
          user.passwordChangedAt.getTime() / 1000
        );

      if (
        decoded.iat <
        passwordChangedTimestamp
      ) {
        return res.status(401).json({
          message:
            "Password changed. Please log in again.",
        });
      }
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, token failed",
    });
  }
};