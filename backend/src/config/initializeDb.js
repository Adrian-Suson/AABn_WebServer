import bcrypt from "bcrypt";
import dotenv from "dotenv";
import db from "./db.js";

dotenv.config();

// Function to initialize the application
const initializeApp = async () => {
  try {
    // Define admin credentials from environment variables
    const adminUser = process.env.USER_NAME;
    const adminPassword = process.env.USER_PASSWORD;
    const adminRole = process.env.USER_ROLE;

    if (!adminUser || !adminPassword || !adminRole) {
      throw new Error("Missing environment variables for admin user setup.");
    }

    // Check if the admin user exists based on the username
    const [users] = await db.query("SELECT * FROM users WHERE username = ?", [
      adminUser,
    ]);

    if (users.length === 0) {
      // Hash the admin password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Construct the email
      const email = `${adminUser}@example.com`;

      // Insert the admin user into the users table
      await db.query(
        "INSERT INTO users (username, password, role, first_name, last_name, email, phone_number, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          adminUser,
          hashedPassword,
          adminRole,
          "Admin",
          "User",
          email, 
          "123-456-7890",
          "default_profile.jpg",
        ]
      );

      console.log("Admin user created.");
    } else {
      console.log("Admin user already exists or the database is not empty.");
    }
  } catch (error) {
    console.error("Error setting up the database and admin user:", error);
  }
};

// Initialize the application
initializeApp();
