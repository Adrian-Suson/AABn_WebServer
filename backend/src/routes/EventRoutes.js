import express from "express";
import db from "../config/db.js"; // Assuming db is a pool connection

const router = express.Router();

// Endpoint to create a new event
router.post("/events", async (req, res) => {
  const { title, event_date, event_time, created_by, attendees, description } =
    req.body;

  // Check for required fields
  if (!title || !event_date || !event_time || !created_by) {
    return res.status(400).json({
      message:
        "Missing required fields: title, event_date, event_time, created_by",
    });
  }

  // Validate attendees
  if (!Array.isArray(attendees) || attendees.length === 0) {
    return res
      .status(400)
      .json({ message: "Attendees must be a non-empty array" });
  }

  let connection;
  try {
    // Get a connection from the pool
    connection = await db.getConnection();
    await connection.beginTransaction(); // Start a transaction

    // SQL query to insert a new event
    const insertEventQuery = `
      INSERT INTO events (title, event_date, event_time, created_by, description)
      VALUES (?, ?, ?, ?, ?)
    `;

    // Execute event insertion query
    const [eventResult] = await connection.query(insertEventQuery, [
      title,
      event_date,
      event_time,
      created_by,
      description || null,
    ]);

    // Get the newly created event ID
    const eventId = eventResult.insertId;

    // SQL query to insert attendees into the event_attendees table
    const insertAttendeesQuery = `
      INSERT INTO event_attendees (event_id, user_id)
      VALUES ?
    `;

    // Prepare the attendee data for bulk insertion
    const attendeesData = attendees.map((userId) => [eventId, userId]);

    // Execute attendees insertion query
    await connection.query(insertAttendeesQuery, [attendeesData]);

    // Commit the transaction
    await connection.commit();

    res
      .status(201)
      .json({ message: "Event and attendees created successfully" });
  } catch (error) {
    console.error("Error creating event:", error);

    if (connection) {
      await connection.rollback(); // Rollback the transaction if something goes wrong
    }

    res
      .status(500)
      .json({ message: "An error occurred while creating the event" });
  } finally {
    if (connection) {
      connection.release(); // Release the connection back to the pool
    }
  }
});

router.get("/events", async (req, res) => {
  const { user_id } = req.query; // Assume the frontend sends the logged-in user's ID
  const currentDate = new Date(); // Get the current date

  try {
    // SQL query to delete events that are past the current date
    const deleteQuery = `
      DELETE FROM events 
      WHERE event_date < ?
    `;

    // Execute delete query to remove past events
    await db.query(deleteQuery, [currentDate]);

    // SQL query to get events where the user is an attendee or the creator
    const query = `
      SELECT e.event_id, e.title, e.event_date, e.event_time, e.description, e.created_at, 
             e.created_by, creator.first_name AS creator_first_name, creator.last_name AS creator_last_name,
             attendee.userId AS attendee_userId, attendee.first_name AS attendee_first_name, 
             attendee.last_name AS attendee_last_name, attendee.email AS attendee_email
      FROM events e
      LEFT JOIN users creator ON e.created_by = creator.userId
      LEFT JOIN event_attendees ea ON e.event_id = ea.event_id
      LEFT JOIN users attendee ON ea.user_id = attendee.userId
      WHERE ea.user_id = ? OR e.created_by = ?
      ORDER BY e.event_date DESC
    `;

    const [results] = await db.query(query, [user_id, user_id]);

    // Transform results into a structured format
    const eventsMap = {};

    results.forEach((row) => {
      if (!eventsMap[row.event_id]) {
        eventsMap[row.event_id] = {
          event_id: row.event_id,
          title: row.title,
          event_date: row.event_date,
          event_time: row.event_time,
          description: row.description,
          created_at: row.created_at,
          creator: {
            userId: row.created_by,
            first_name: row.creator_first_name,
            last_name: row.creator_last_name,
          },
          attendees: [],
          is_creator: row.created_by === user_id,
        };
      }
      // Add attendee info
      if (row.attendee_userId) {
        eventsMap[row.event_id].attendees.push({
          userId: row.attendee_userId,
          first_name: row.attendee_first_name,
          last_name: row.attendee_last_name,
          email: row.attendee_email,
        });
      }
    });

    const events = Object.values(eventsMap);

    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "An error occurred while fetching events" });
  }
});



export default router;
