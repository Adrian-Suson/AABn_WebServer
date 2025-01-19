import express from "express";
import db from "../config/db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config(); // Load environment variables

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Helper function to get the profile pictures directory
const getProfilePicDir = () =>
  path.join(__dirname, "..", "..", "assets", "ProfilePic");

// Setup storage for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = getProfilePicDir();
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

// Consolidated route to update user profile and/or profile picture
/**
 * @route PUT /profile/:userId
 * @param {string} userId - The ID of the user
 * @body {string} email - The new email
 * @body {string} first_name - The new first name
 * @body {string} last_name - The new last name
 * @body {string} phone_number - The new phone number
 * @body {string} username - The new username
 * @body {string} password - The new password (optional)
 * @body {file} profilePic - The new profile picture file (optional)
 */
router.put(
  "/profile/:userId",
  upload.single("profilePic"),
  async (req, res) => {
    const { userId } = req.params;
    const { email, first_name, last_name, phone_number, username, password } =
      req.body;
    const imageUrl = req.file ? req.file.filename : null; // Handle optional image

    try {
      const updateFields = [
        "email = ?",
        "first_name = ?",
        "last_name = ?",
        "phone_number = ?",
        "username = ?",
      ];

      const values = [email, first_name, last_name, phone_number, username];

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push("password = ?");
        values.push(hashedPassword);
      }

      if (imageUrl) {
        updateFields.push("image_url = ?");
        values.push(imageUrl);
      }

      // Add WHERE clause
      const sqlQuery = `UPDATE users SET ${updateFields.join(
        ", "
      )} WHERE userId = ?;`;
      values.push(userId);

      const result = await db.query(sqlQuery, values);

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Profile not found." });
      }

      res.json({
        success: true,
        message: "Profile updated successfully.",
        imageUrl,
      });
    } catch (error) {
      console.error("Profile Update Error:", error);
      res
        .status(500)
        .json({ success: false, message: "Error updating the profile." });
    }
  }
);

// Endpoint to fetch user profile by userId
/**
 * @route GET /profile/:userId
 * @param {string} userId - The ID of the user
 */
router.get("/profile/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const [profile] = await db.query("SELECT * FROM users WHERE userId = ?", [
      userId,
    ]);

    if (profile.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found." });
    }

    // Exclude password from response
    const { password, ...profileWithoutPassword } = profile[0];

    // Include plaintext password (for debugging purposes only)
    const response = {
      success: true,
      profile: profileWithoutPassword,
      // Add the plaintext password here (highly discouraged for real use)
      plaintextPassword: password, // WARNING: This is insecure
    };

    res.json(response);
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching the profile." });
  }
});

export default router;
