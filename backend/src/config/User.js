import bcrypt from "bcrypt";
import dotenv from "dotenv";
import db from "./db.js";

dotenv.config();

// List of users to be initialized
const users = [
  {
    username: "user",
    password: "user123",
    role: "S1",
    firstName: "Example",
    lastName: "User1",
    email: "exampleuser1@example.com",
    phone: "987-654-3211",
  },
  {
    username: "user1",
    password: "user123",
    role: "S2",
    firstName: "Example",
    lastName: "User2",
    email: "exampleuser2@example.com",
    phone: "987-654-3212",
  },
  {
    username: "user2",
    password: "user123",
    role: "S3",
    firstName: "Example",
    lastName: "User3",
    email: "exampleuser3@example.com",
    phone: "987-654-3213",
  },
  {
    username: "user3",
    password: "user123",
    role: "S4",
    firstName: "Example",
    lastName: "User4",
    email: "exampleuser4@example.com",
    phone: "987-654-3214",
  },
  {
    username: "user4",
    password: "user123",
    role: "S1",
    firstName: "Example",
    lastName: "User5",
    email: "exampleuser5@example.com",
    phone: "987-654-3215",
  },
];

// Function to initialize users
const initializeUsers = async () => {
  try {
    for (const user of users) {
      // Check if the user exists
      const [existingUsers] = await db.query(
        "SELECT * FROM users WHERE username = ? OR email = ?",
        [user.username, user.email]
      );

      if (existingUsers.length === 0) {
        // Hash the user's password
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // Insert user into the users table
        await db.query(
          "INSERT INTO users (username, password, role, first_name, last_name, email, phone_number, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            user.username,
            hashedPassword,
            user.role,
            user.firstName,
            user.lastName,
            user.email,
            user.phone,
            "default_profile.jpg",
          ]
        );

        console.log(`User ${user.username} created.`);
      } else {
        console.log(`User ${user.username} already exists.`);
      }
    }
  } catch (error) {
    console.error("Error setting up users and profiles:", error);
  }
};

// Initialize the users
initializeUsers();
