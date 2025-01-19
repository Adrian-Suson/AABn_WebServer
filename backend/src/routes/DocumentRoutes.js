import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url"; // Import this to define __dirname in ES modules
import db from "../config/db.js"; // Assuming you have a db.js for your SQL connection
import { body, validationResult } from "express-validator";

// Create __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Setup storage for document attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "..", "..", "assets", "Documents");
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
    const filename = `${sanitizedFilename}`;
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });

// Function to generate a unique document code
const generateDocumentCode = async () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const [result] = await db.query("SELECT COUNT(*) as count FROM documents");
  const count = result[0].count + 1;
  const code = `DOC-${datePart}-${String(count).padStart(4, "0")}`;
  return code;
};

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

// Function to handle form submission (document and recipients)
router.post("/submit-form", upload.single("file"), async (req, res) => {
  const {
    documentId, // New input for manual Document ID
    sender,
    recipient,
    subject,
    description,
    prioritization,
    dateOfLetter,
    classification,
    deadline,
  } = req.body;
  let fileUrl = null;

  // Handle file upload if present
  if (req.file) {
    fileUrl = req.file.filename;
  }

  try {
    // Handle JSON parsing of sender and recipient
    let parsedSender, parsedRecipient;
    try {
      parsedSender = JSON.parse(sender);
      parsedRecipient = JSON.parse(recipient); // Array of recipients
    } catch (jsonError) {
      return res.status(400).json({ message: "Invalid JSON format" });
    }

    // Check if sender exists in `users`, if not insert a new user
    let [senderResult] = await db.query(
      "SELECT userId FROM users WHERE email = ?",
      [parsedSender.email]
    );
    let senderId;

    if (senderResult.length === 0) {
      const [insertSenderResult] = await db.query(
        "INSERT INTO users (first_name, last_name, email, username, password, role) VALUES (?, ?, ?, ?, ?, ?)",
        [
          parsedSender.name.split(" ")[0],
          parsedSender.name.split(" ")[1] || "",
          parsedSender.email,
          parsedSender.username,
          parsedSender.password, // Ensure you hash this in production
          parsedSender.role || "User", // Default role
        ]
      );
      senderId = insertSenderResult.insertId;
    } else {
      senderId = senderResult[0].userId;
    }

    // Validate the documentId (check for uniqueness, etc.)
    const [existingDocResult] = await db.query(
      "SELECT * FROM documents WHERE document_code = ?",
      [documentId]
    );
    
    if (existingDocResult.length > 0) {
      return res.status(400).json({ message: "Document ID already exists." });
    }

    // Insert document with the provided document ID
    const [documentResult] = await db.query(
      `INSERT INTO documents (document_code, sender_id, subject, description, prioritization, date_of_letter, classification, deadline, file_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        documentId, // Use the manual document ID
        senderId,
        subject,
        description,
        prioritization,
        dateOfLetter,
        classification,
        deadline,
        fileUrl,
      ]
    );

    // Insert recipients with initial status (e.g., 'Pending')
    const recipientPromises = parsedRecipient.map(async (rec) => {
      // Check if recipient exists in users, if not insert
      const [recipientResult] = await db.query(
        "SELECT userId FROM users WHERE email = ?",
        [rec.email]
      );

      if (recipientResult.length === 0) {
        return res
          .status(400)
          .json({ message: `Recipient ${rec.email} not found.` });
      }

      const userId = recipientResult[0].userId;

      return db.query(
        "INSERT INTO recipients (document_code, user_id, status) VALUES (?, ?, ?)",
        [documentId, userId, "Pending"] // Use the manual document ID
      );
    });

    await Promise.all(recipientPromises);

    // Log document creation action
    await logDocumentAction(documentId, senderId, "Document Created");

    res
      .status(201)
      .json({ message: "Form submitted successfully", documentCode: documentId });
  } catch (error) {
    console.error("Error during form submission:", error);
    res
      .status(500)
      .json({ message: "An error occurred during form submission" });
  }
});


// Endpoint to update the status of a document for a specific recipient
router.put(
  "/update-recipient-status/:documentCode",
  [
    body("recipient_email")
      .isEmail()
      .withMessage("Recipient email is required"),
    body("status")
      .isIn(["Pending", "Received", "Archived", "Ended"])
      .withMessage("Invalid status value"),
  ],
  async (req, res) => {
    const { documentCode } = req.params;
    const { recipient_email, status } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Update status for the specific recipient for the given document_code
      const [result] = await db.query(
        `UPDATE recipients r
         JOIN users u ON r.user_id = u.userId
         SET r.status = ?
         WHERE r.document_code = ? AND u.email = ?`, // Fixed condition here
        [status, documentCode, recipient_email]
      );

      // Log the action
      const [userResult] = await db.query(
        "SELECT userId FROM users WHERE email = ?",
        [recipient_email]
      );
      await logDocumentAction(
        documentCode,
        userResult[0].userId,
        `Status updated to ${status} by ${recipient_email}`
      );

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "Recipient or document not found" });
      }

      res
        .status(200)
        .json({ message: "Recipient status updated successfully" });
    } catch (error) {
      console.error("Error updating recipient status:", error);
      res
        .status(500)
        .json({ message: "An error occurred while updating the status" });
    }
  }
);

// Endpoint to fetch documents for a specific recipient
router.get("/get-documents/:recipientEmail", async (req, res) => {
  const { recipientEmail } = req.params;

  try {
    // Fetch documents that are assigned to this recipient along with sender information
    const [documents] = await db.query(
      `SELECT
        d.id AS document_id,
        d.document_code,
        d.subject,
        d.description,
        d.prioritization,
        d.date_of_letter,
        d.classification,
        d.deadline,
        d.file_name,
        d.created_at,
        d.sender_id,
        CONCAT(u.first_name, ' ', u.last_name) AS sender_name,
        u.email AS sender_email,
        r.status AS recipient_status
      FROM documents d
      JOIN recipients r ON d.document_code = r.document_code  -- Join on document_code
      JOIN users u ON d.sender_id = u.userId
      JOIN users ur ON r.user_id = ur.userId  -- Join to get recipient info
      WHERE ur.email = ?  -- Filter by recipient's email
      ORDER BY d.created_at DESC`,
      [recipientEmail]
    );

    // Check if there are any documents
    if (documents.length === 0) {
      console.log(`No documents found for recipient ${recipientEmail}`);
      return res.status(200).json([]);
    }

    // Optionally fetch the recipients for each document (if needed)
    const documentCodes = documents.map((doc) => doc.document_code);

    if (documentCodes.length > 0) {
      const [recipients] = await db.query(
        `SELECT
          r.document_code,
          u.first_name AS recipient_first_name,
          u.last_name AS recipient_last_name,
          u.email AS recipient_email,
          r.status AS recipient_status
        FROM recipients r
        JOIN users u ON r.user_id = u.userId  -- Join with users table to get recipient info
        WHERE r.document_code IN (?)`, // Use document_code for filtering
        [documentCodes]
      );

      // Group recipients by document_code
      const recipientsMap = recipients.reduce((acc, recipient) => {
        const fullName = `${recipient.recipient_first_name} ${recipient.recipient_last_name}`;
        if (!acc[recipient.document_code]) {
          acc[recipient.document_code] = [];
        }
        acc[recipient.document_code].push({
          name: fullName,
          email: recipient.recipient_email,
          status: recipient.recipient_status,
        });
        return acc;
      }, {});

      // Attach recipients to the documents
      const documentsWithRecipients = documents.map((doc) => ({
        ...doc,
        recipients: recipientsMap[doc.document_code] || [], // Match recipients by document_code
      }));

      res.status(200).json(documentsWithRecipients);
    } else {
      res.status(200).json(documents);
    }
  } catch (error) {
    console.error("Error fetching documents:", error);
    res
      .status(500)
      .json({ message: "An error occurred while fetching documents" });
  }
});

// Endpoint to fetch documents for a specific sender
router.get("/get-sent-documents/:senderEmail", async (req, res) => {
  const { senderEmail } = req.params;

  try {
    // Fetch the sender's userId based on the email
    const [senderResult] = await db.query(
      "SELECT userId FROM users WHERE email = ?",
      [senderEmail]
    );

    // If no sender is found, return 404
    if (senderResult.length === 0) {
      return res.status(404).json({ message: "Sender not found" });
    }

    const senderId = senderResult[0].userId;

    // Fetch documents that were sent by this sender
    const [documents] = await db.query(
      `SELECT
        d.id AS document_id,
        d.document_code,
        d.subject,
        d.description,
        d.prioritization,
        d.date_of_letter,
        d.classification,
        d.deadline,
        d.file_name,
        d.created_at,
        d.sender_id,
        CONCAT(u.first_name, ' ', u.last_name) AS sender_name
      FROM documents d
      JOIN users u ON d.sender_id = u.userId
      WHERE d.sender_id = ?
      ORDER BY d.created_at DESC`,
      [senderId]
    );

    // If no documents found, return empty array
    if (documents.length === 0) {
      return res.status(200).json([]);
    }

    // Fetch recipients for each document, if any documents are found
    const documentCodes = documents.map((doc) => doc.document_code);

    if (documentCodes.length > 0) {
      const [recipients] = await db.query(
        `SELECT
          r.document_code,
          u.first_name AS recipient_first_name,
          u.last_name AS recipient_last_name,
          u.email AS recipient_email,
          r.status AS recipient_status
        FROM recipients r
        JOIN users u ON r.user_id = u.userId
        WHERE r.document_code IN (?)
        `,
        [documentCodes]
      );

      // Group recipients by document_code
      const recipientsMap = recipients.reduce((acc, recipient) => {
        if (!acc[recipient.document_code]) {
          acc[recipient.document_code] = [];
        }
        acc[recipient.document_code].push({
          name: `${recipient.recipient_first_name} ${recipient.recipient_last_name}`,
          email: recipient.recipient_email,
          status: recipient.recipient_status,
        });
        return acc;
      }, {});

      // Attach recipients to their respective documents
      const documentsWithRecipients = documents.map((doc) => ({
        ...doc,
        recipients: recipientsMap[doc.document_code] || [], // Attach recipients or empty array
      }));

      // Return documents with recipients
      return res.status(200).json(documentsWithRecipients);
    } else {
      // If no document codes, return documents without recipients
      return res.status(200).json(documents);
    }
  } catch (error) {
    console.error("Error fetching sent documents:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching documents" });
  }
});

// Endpoint to delete a recipient from a document
router.delete(
  "/delete-recipient/:documentCode/:recipientEmail",
  async (req, res) => {
    const { documentCode, recipientEmail } = req.params;

    try {
      // Get the user ID of the recipient to log the action
      const [userResult] = await db.query(
        "SELECT userId FROM users WHERE email = ?",
        [recipientEmail]
      );
      if (userResult.length === 0) {
        return res.status(404).json({ message: "Recipient not found" });
      }

      // Delete the recipient from the recipients table
      const [result] = await db.query(
        "DELETE FROM recipients WHERE document_code = ? AND user_id = (SELECT userId FROM users WHERE email = ?)",
        [documentCode, recipientEmail]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Recipient not found" });
      }

      // Log the action
      await logDocumentAction(
        documentCode,
        userResult[0].userId,
        `Recipient ${recipientEmail} deleted from document ${documentCode}`
      );

      res.status(200).json({ message: "Recipient deleted successfully" });
    } catch (error) {
      console.error("Error deleting recipient:", error);
      res.status(500).json({ message: "An error occurred while deleting the recipient" });
    }
  }
);


// Backend - forward-document endpoint
router.post("/forward-document/:documentCode", async (req, res) => {
  const { documentCode } = req.params;
  const { recipientEmail } = req.body;

  try {
    const [documentResult] = await db.query(
      "SELECT * FROM documents WHERE document_code = ?",
      [documentCode]
    );

    if (documentResult.length === 0) {
      return res.status(404).json({ message: "Document not found." });
    }

    const [recipientResult] = await db.query(
      "SELECT userId FROM users WHERE email = ?",
      [recipientEmail]
    );

    if (recipientResult.length === 0) {
      return res.status(404).json({ message: "Recipient not found." });
    }

    const userId = recipientResult[0].userId;

    // Check if recipient already received the document
    const [existingRecipient] = await db.query(
      "SELECT * FROM recipients WHERE document_code = ? AND user_id = ?",
      [documentCode, userId]
    );

    if (existingRecipient.length > 0) {
      return res
        .status(400)
        .json({ message: "Recipient has already received this document." });
    }

    // Insert new recipient for the forwarded document
    await db.query(
      "INSERT INTO recipients (document_code, user_id, status) VALUES (?, ?, ?)",
      [documentCode, userId, "Pending"]
    );

    await logDocumentAction(
      documentCode,
      userId,
      `Document forwarded to "${recipientEmail}"`
    );

    res.status(201).json({ message: "Document forwarded successfully." });
  } catch (error) {
    console.error("Error forwarding document:", error);
    res
      .status(500)
      .json({ message: "An error occurred while forwarding the document." });
  }
});

// Endpoint to get all actions from document_tracking by document_code
router.get("/document-tracking/:documentCode", async (req, res) => {
  const { documentCode } = req.params;

  try {
    // SQL query to fetch only from the document_tracking table based on document_code
    const query = `
      SELECT
        tracking_id,
        document_code,
        action,
        action_date
      FROM
        document_tracking
      WHERE
        document_code = ?
    `;

    const [results] = await db.query(query, [documentCode]);

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "No actions found for this document code." });
    }

    res.status(200).json(results);
  } catch (error) {
    console.error(
      "Error fetching document actions from document_tracking:",
      error
    );
    res.status(500).json({
      message: "An error occurred while fetching the document actions.",
    });
  }
});

// Route to fetch all documents
router.get("/documents", async (req, res) => {
  try {
    // Fetch all documents from the documents table
    const [results] = await db.query(
      `SELECT
        d.id AS document_id,
        d.document_code,
        d.subject,
        d.description,
        d.prioritization,
        d.date_of_letter,
        d.classification,
        d.deadline,
        d.file_name,
        d.created_at,
        d.sender_id,
        CONCAT(u.first_name, ' ', u.last_name) AS sender_name,
        u.email AS sender_email
      FROM documents d
      JOIN users u ON d.sender_id = u.userId
      ORDER BY d.created_at DESC`
    );

    // Return the response in a consistent format
    res.json({
      success: true,
      documents: results,
    });
  } catch (error) {
    console.error("Documents Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching documents.",
    });
  }
});


export default router;
