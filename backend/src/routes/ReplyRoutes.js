import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import db from "../config/db.js";
import { body, validationResult } from "express-validator";
import { v4 as uuidv4 } from "uuid"; // Import UUID for unique reply codes

// Create __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Setup storage for document attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "..", "..", "assets", "replyDocument");
    fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) {
        console.error("Error creating directory:", err);
        return cb(err);
      }
      cb(null, dir);
    });
  },
  filename: (req, file, cb) => {
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, sanitizedFilename);
  },
});

const upload = multer({ storage });

const logDocumentAction = async (documentCode, userId, action) => {
  try {
    await db.query(
      `INSERT INTO document_tracking (document_code, user_id, action) VALUES (?, ?, ?)`,
      [documentCode, userId, action]
    );
  } catch (error) {
    console.error("Error logging document action:", error);
  }
};

// Reply Submission Endpoint
// Reply Submission Endpoint
router.post(
  "/submit-reply",
  upload.single("file"),
  [
    body("document_id").isInt().withMessage("Valid document ID is required"),
    body("user_id").isInt().withMessage("Valid user ID is required"),
    body("receiver_id").isInt().withMessage("Valid receiver ID is required"),
    body("reply_text").notEmpty().withMessage("Reply text is required"),
  ],
  async (req, res) => {
    const reply_code = uuidv4();
    const { document_id, user_id, receiver_id, reply_text } = req.body;

    const reply_date = new Date();
    const file_name = req.file ? req.file.filename : null;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Retrieve the document code based on the document_id
      const [documentResult] = await db.query(
        `SELECT document_code FROM documents WHERE id = ?`,
        [document_id]
      );

      const [userResult] = await db.query(
        `SELECT email FROM users WHERE userId = ?`,
        [user_id]
      );

      if (documentResult.length === 0) {
        return res.status(404).json({ message: "Document not found" });
      }

      const document_code = documentResult[0].document_code;

      if (documentResult.length === 0) {
        return res.status(404).json({ message: "Document not found" });
      }

      const email = userResult[0].email;


      // Insert reply into the database
      const [result] = await db.query(
        `INSERT INTO replies (reply_code, document_id, user_id, receiver_id, reply_text, file_name, date_of_reply)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          reply_code,
          document_id,
          user_id,
          receiver_id,
          reply_text,
          file_name,
          reply_date,
        ]
      );

      // Log the document action using document_code
      await logDocumentAction(
        document_code,
        user_id,
        `Reply "${reply_text}"  by  "${email}"`
      );

      res.status(201).json({
        message: "Reply submitted successfully",
        replyId: result.insertId,
      });
    } catch (error) {
      console.error("Error submitting reply:", error);
      res.status(500).json({
        message: "An error occurred while submitting the reply",
        error: error.message,
      });
    }
  }
);

// Get Replies Endpoint
router.get("/get-replies", async (req, res) => {
  try {
    const [replies] = await db.query(
      `SELECT
          replies.*,
          documents.subject AS document_subject,
          documents.description AS document_description,
          documents.document_code AS document_code,
          sender.username AS sender_name,
          receiver.username AS receiver_name
       FROM replies
       JOIN documents ON replies.document_id = documents.id
       JOIN users AS sender ON replies.user_id = sender.userId
       JOIN users AS receiver ON replies.receiver_id = receiver.userId`
    );

    if (replies.length === 0) {
      return res.status(404).json({ message: "No replies found" });
    }

    res.status(200).json(replies);
  } catch (error) {
    console.error("Error retrieving replies:", error);
    res.status(500).json({
      message: "An error occurred while retrieving replies",
      error: error.message,
    });
  }
});

// Get Replies by Receiver
router.get("/get-replies/:receiverId", async (req, res) => {
  const receiverId = req.params.receiverId;

  if (!receiverId) {
    return res.status(400).json({ message: "Receiver ID is required" });
  }

  try {
    const [replies] = await db.query(
      `SELECT
          replies.*,
          documents.subject AS document_subject,
          documents.description AS document_description,
          documents.document_code AS document_code,
          sender.username AS sender_name,
          receiver.username AS receiver_name
       FROM replies
       JOIN documents ON replies.document_id = documents.id
       JOIN users AS sender ON replies.user_id = sender.userId
       JOIN users AS receiver ON replies.receiver_id = receiver.userId
       WHERE replies.receiver_id = ?`,
      [receiverId]
    );

    if (replies.length === 0) {
      return res
        .status(404)
        .json({ message: "No replies found for this receiver ID" });
    }

    res.status(200).json(replies);
  } catch (error) {
    console.error("Error retrieving replies:", error);
    res.status(500).json({
      message: "An error occurred while retrieving replies",
      error: error.message,
    });
  }
});

// Get Replies by Document ID
router.get("/get-replies-by-docx/:document_id", async (req, res) => {
  const { document_id } = req.params;

  try {
    const [replies] = await db.query(
      `SELECT
          replies.*,
          documents.subject AS document_subject,
          documents.description AS document_description,
          documents.document_code AS document_code,
          sender.username AS sender_name,
          receiver.username AS receiver_name
       FROM replies
       JOIN documents ON replies.document_id = documents.id
       JOIN users AS sender ON replies.user_id = sender.userId
       JOIN users AS receiver ON replies.receiver_id = receiver.userId
       WHERE replies.document_id = ?`,
      [document_id]
    );

    if (replies.length === 0) {
      return res
        .status(404)
        .json({ message: "No replies found for this document ID" });
    }

    res.status(200).json(replies);
  } catch (error) {
    console.error("Error retrieving replies:", error);
    res.status(500).json({
      message: "An error occurred while retrieving replies",
      error: error.message,
    });
  }
});

router.post("/mark-replies-seen/:userId", async (req, res) => {
  console.log("Request Body:", req.body);
  const { document_id } = req.body;
  const userId = req.params.userId;

  if (!document_id) {
    return res.status(400).json({ message: "Document ID is required" });
  }

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  try {
    console.log(
      `Updating replies for document ID: ${document_id} excluding user ID: ${userId}`
    );

    const [result] = await db.query(
      `UPDATE replies SET seen = TRUE WHERE document_id = ? AND user_id != ?`,
      [document_id, userId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No replies found for this document ID" });
    }

    res.status(200).json({ message: "Replies marked as seen" });
  } catch (error) {
    console.error("Error marking replies as seen:", error);
    res.status(500).json({
      message: "An error occurred while marking replies as seen",
      error: error.message,
    });
  }
});

// Count Unseen Replies for Sender Endpoint
router.get("/count-not-seen-replies/:sender_id", async (req, res) => {
  const { sender_id } = req.params;

  if (!sender_id) {
    return res.status(400).json({ message: "Sender ID is required" });
  }

  console.log("Fetching unseen replies for sender_id:", sender_id);

  try {
    const [countResult] = await db.query(
      `SELECT COUNT(*) AS notSeenCount
       FROM replies
       WHERE receiver_id = ? AND seen = FALSE`,
      [sender_id]
    );

    const notSeenCount = countResult[0]?.notSeenCount || 0;

    res.status(200).json({ notSeenCount });
  } catch (error) {
    console.error("Error counting unseen replies for sender:", error);
    res.status(500).json({
      message: "An error occurred while counting unseen replies for sender",
      error: error.message,
      stack: error.stack, // Include stack trace if necessary
    });
  }
});

// Count Unseen Replies for User Endpoint
router.get("/count-not-seen-replies/user/:user_id", async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({ message: "User ID is required" });
  }

  console.log("Fetching unseen replies for user_id:", user_id);

  try {
    const [countResult] = await db.query(
      `SELECT COUNT(*) AS notSeenCount
       FROM replies
       WHERE receiver_id != ? AND seen = FALSE`,
      [user_id]
    );

    const notSeenCount = countResult[0]?.notSeenCount || 0;

    res.status(200).json({ notSeenCount });
  } catch (error) {
    console.error("Error counting unseen replies for user:", error);
    res.status(500).json({
      message: "An error occurred while counting unseen replies for user",
      error: error.message,
      stack: error.stack,
    });
  }
});

export default router;
