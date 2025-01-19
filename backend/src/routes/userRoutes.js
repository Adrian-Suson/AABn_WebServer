import express from "express";
import db from "../config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Setup storage for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "..", "..", "assets", "ProfilePic");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `${datePrefix}-${file.originalname}`;
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });
const jwtSecretKey = process.env.TOKEN_SECRET;

// Route to handle user login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required.",
    });
  }

  try {
    const [user] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user[0].password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    const token = jwt.sign(
      {
        userId: user[0].userId,
        username: user[0].username,
        role: user[0].role,
      },
      jwtSecretKey,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      userId: user[0].userId,
      role: user[0].role,
      email: user[0].email, // Adjusted to fetch email directly from user
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during login.",
    });
  }
});

// Endpoint to register a new user
router.post("/register", async (req, res) => {
  const { username, password, role } = req.body;

  // Validate required fields
  if (!username || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Username, password, and role are required.",
    });
  }

  try {
    // Check if the username already exists
    const [existingUser] = await db.query(
      "SELECT userId FROM users WHERE username = ?",
      [username]
    );
    if (existingUser.length > 0) {
      return res.status(409).json({ success: false, message: "Username already exists." });
    }

    // Auto-generate fields
    const hashedPassword = await bcrypt.hash(password, 10);
    const firstName = "First Name"; // Default first name
    const lastName = "Last Name"; // Default last name
    const email = `${username}@example.com`; // Auto-generated email
    const phoneNumber = ''; // Default phone number
    const imageName = "default_profile.jpg"; // Default profile picture

    // Insert new user into the users table (id is auto-generated)
    const [result] = await db.query(
      "INSERT INTO users (username, password, role, first_name, last_name, email, phone_number, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [username, hashedPassword, role, firstName, lastName, email, phoneNumber, imageName]
    );
    const userId = result.insertId;

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      userId: userId,
      imageName: imageName,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during registration.",
    });
  }
});


// Route to get a user by userId
router.get("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const [user] = await db.query("SELECT * FROM users WHERE userId = ?", [
      userId,
    ]);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const userData = user[0];

    // Ensure image_url is always present
    userData.profile = {
      ...userData.profile,
      image_url: userData.profile?.image_url || "/default-image.png",
    };

    res.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("User Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching the user.",
    });
  }
});
// Route to delete a user
router.delete("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const [user] = await db.query("SELECT * FROM users WHERE userId = ?", [
      userId,
    ]);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    await db.query("DELETE FROM users WHERE userId = ?", [userId]);

    res.json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    console.error("User Deletion Error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the user.",
    });
  }
});

// Route to get all users
router.get("/users", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM users");

    res.json({
      success: true,
      users: results,
    });
  } catch (error) {
    console.error("Users Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching users.",
    });
  }
});



export default router;
