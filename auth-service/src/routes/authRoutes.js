import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

/**
 * Helper function untuk membuat token JWT
 * Payload berisi userId agar bisa dikenali oleh service lain
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ==========================================
// 1. REGISTER ROUTE
// ==========================================
router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }

    // Cek duplikasi email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Cek duplikasi username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Generate profil image otomatis menggunakan Dicebear
    const profileImage = `https://api.dicebear.com/7.x/lorelei/svg?seed=${username}`;

    const user = new User({
      email,
      username,
      password,
      profileImage,
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt, // Perbaikan typo: cretedAt -> createdAt
      },
    });
  } catch (error) {
    console.error("Error in register route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ==========================================
// 2. LOGIN ROUTE
// ==========================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Cari user berdasarkan email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    // Validasi password (menggunakan method dari User model)
    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in login route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ==========================================
// 3. INTER-SERVICE COMMUNICATION ENDPOINT
// Digunakan oleh Book-Service untuk ambil profil user
// ==========================================
router.get("/user/:id", async (req, res) => {
  try {
    // Cari user berdasarkan ID, jangan kirim password
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kembalikan profil user dalam format JSON [cite: 15]
    res.json(user);
  } catch (error) {
    console.error("Error fetching user for book-service:", error);
    res.status(500).json({ message: "Error fetching user data" });
  }
});

export default router;
