import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

const publicUser = (user) => ({
  id: user._id,
  role: user.role,
  name: user.name,
  organizationName: user.organizationName,
  organizationType: user.organizationType,
  registrationNumber: user.registrationNumber,
  email: user.email,
  phone: user.phone,
  location: user.location,
  verificationStatus: user.verificationStatus
});

export const register = async (req, res) => {
  try {
    const {
      role,
      name,
      organizationName,
      organizationType,
      registrationNumber,
      email,
      phone,
      password,
      location,
      proofDocument
    } = req.body;

    if (!role || !email || !phone || !password || !location) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    if (!["INDIVIDUAL", "VOLUNTEER", "NGO"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    if (["INDIVIDUAL", "VOLUNTEER"].includes(role) && !name) {
      return res.status(400).json({
        success: false,
        message: "Name is required"
      });
    }

    if (role === "NGO" && !organizationName) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required"
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase()
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      role,
      name,
      organizationName,
      organizationType,
      registrationNumber,
      email,
      phone,
      password: hashedPassword,
      location,
      proofDocument,
      verificationStatus: role === "NGO" ? "PENDING" : "VERIFIED"
    });

    const token = generateToken(user._id.toString());

    res.cookie("token", token, cookieOptions);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: publicUser(user)
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message: error.code === 11000 ? "Email is already registered" : "Registration failed"
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = generateToken(user._id.toString());

    res.cookie("token", token, cookieOptions);

    res.json({
      success: true,
      message: "Login successful",
      user: publicUser(user)
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  });

  res.json({
    success: true,
    message: "Logout successful"
  });
};

export const me = async (req, res) => {
  res.json({
    success: true,
    user: publicUser(req.user)
  });
};

export const forgotPassword = async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  const user = email ? await User.findOne({ email }) : null;
  const response = {
    success: true,
    message: "If that email is registered, password reset instructions have been sent."
  };

  if (!user) return res.json(response);

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  try {
    await sendPasswordResetEmail({ email: user.email, name: user.name || user.organizationName, token: resetToken });
    res.json(response);
  } catch (error) {
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    console.error("Password reset email error:", error.message);
    const isConfigurationError = error.message.includes("not configured");
    res.status(isConfigurationError ? 503 : 502).json({
      success: false,
      message: isConfigurationError
        ? error.message
        : "Password reset email could not be sent. Please try again later."
    });
  }
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 8) {
    return res.status(400).json({ success: false, message: "A valid reset token and password of at least 8 characters are required" });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ success: false, message: "Reset token is invalid or expired" });

  user.password = await bcrypt.hash(password, 12);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();
  res.json({ success: true, message: "Password reset successful. You can now sign in." });
};
