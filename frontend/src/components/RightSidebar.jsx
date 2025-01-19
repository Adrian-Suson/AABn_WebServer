import { useState, useEffect, useCallback } from "react";
import {
  Box,
  IconButton,
  Typography,
  Card,
  CardContent,
  Button,
} from "@mui/material";
import { EventAvailable } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import PropTypes from "prop-types";
import axios from "axios"; // Import axios for API requests
import config from "../config/config"; // Ensure you have your API config
import EventPlanner from "./EventPlanner";

const RightSidebar = ({ isExpanded, toggleSidebar }) => {
  const [selectedDate, setSelectedDate] = useState(null); // Track selected date
  const [events, setEvents] = useState([]); // Store events
  const [loadingEvents, setLoadingEvents] = useState(false); // Track loading state for events
  const [openEventPlanner, setOpenEventPlanner] = useState(false); // State for the modal
  const userId = localStorage.getItem("userId"); // Replace this with the logged-in user's ID from your authentication logic

  // Handle calendar day click
  const handleDayClick = (date) => {
    setSelectedDate(date);
  };

  // Function to go back and show all events
  const showAllEvents = () => {
    setSelectedDate(null);
  };

  // Fetch events where the logged-in user is an attendee
  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const response = await axios.get(`${config.API}/events`, {
        params: { user_id: userId },
      });
      if (response.status === 200) {
        setEvents(response.data);
        console.log("Events fetched:", response.data);
      } else {
        console.error("Failed to fetch events");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoadingEvents(false);
    }
  }, [userId]);

  // Fetch events when the sidebar is expanded
  useEffect(() => {
    if (isExpanded) {
      fetchEvents(); // Fetch events when the sidebar expands
    }
  }, [isExpanded, fetchEvents]);

  // Function to extract the date in "YYYY-MM-DD" format
  const formatDate = (date) => {
    return new Date(date).toISOString().split("T")[0];
  };

  // Function to format the time to AM/PM format
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Find events for a specific day using date comparison
  const getEventsForDay = (date) => {
    const formattedDate = formatDate(date);
    return events.filter(
      (event) => formatDate(event.event_date) === formattedDate
    );
  };

  const handleAddIconClick = () => {
    setOpenEventPlanner(true); // Open the EventPlanner modal
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row", // Icons and Calendar side by side
        alignItems: "flex-start",
        width: isExpanded ? "333px" : "60px", // Sidebar width
        height: "100vh",
        bgcolor: "#f5f5f5",
        position: "fixed",
        right: 0,
        top: 0,
        transition: "width 0.3s ease",
      }}
    >
      {/* Icon section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "60px",
        }}
      >
        <IconButton onClick={toggleSidebar} sx={{ color: "#357BFDFF", mt: 2 }}>
          <EventAvailable sx={{ fontSize: 30 }} />{" "}
        </IconButton>
        <IconButton
          onClick={handleAddIconClick}
          sx={{ color: "#357BFDFF", mt: 2 }}
        >
          <AddIcon sx={{ fontSize: 30 }} />
        </IconButton>
      </Box>

      {/* Show Calendar when sidebar is expanded */}
      {isExpanded && (
        <Box
          sx={{
            p: 2,
            width: "300px",
            height: "100vh",
            overflowY: "auto", // Allow scrolling if calendar overflows
            borderLeft: "1px solid #ddd", // Add a border between icons and calendar
            bgcolor: "#fff",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Calendar
          </Typography>
          <Calendar
            onClickDay={handleDayClick}
            tileClassName={({ date, view }) => {
              if (view === "month") {
                if (date.getDay() === 0 || date.getDay() === 6) {
                  return "weekend";
                }
              }
              return null;
            }}
          />

          {/* If a date is selected, display events for that specific day */}
          {selectedDate && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Events on {selectedDate.toDateString()}
              </Typography>
              {getEventsForDay(selectedDate).length > 0 ? (
                <Box sx={{ maxHeight: "200px", overflowY: "auto", pr: 1 }}>
                  {/* Scrollable Box */}
                  {getEventsForDay(selectedDate).map((event, index) => (
                    <Card
                      key={index}
                      sx={{
                        mb: 2,
                        borderRadius: "8px",
                        boxShadow: "none",
                        border: "1px solid #e0e0e0",
                        "&:hover": {
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        },
                      }}
                    >
                      <CardContent>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: "bold" }}
                        >
                          {event.title}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Time:</strong> {formatTime(event.event_time)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Description:</strong>{" "}
                          {event.description
                            ? event.description
                            : "No description"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Creator:</strong>{" "}
                          {`${event.creator.first_name} ${event.creator.last_name}`}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Attendees:</strong>{" "}
                          {event.attendees
                            .map(
                              (attendee) =>
                                `${attendee.first_name} ${attendee.last_name}`
                            )
                            .join(", ")}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography>No events on this day.</Typography>
              )}

              {/* Button to show all events again */}
              <Button
                variant="contained"
                onClick={showAllEvents}
                sx={{ mt: 2 }}
              >
                Show All Events
              </Button>
            </Box>
          )}

          {/* Show all events if no specific day is selected */}
          {!selectedDate && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">All Events</Typography>
              {events.length > 0 ? (
                <Box sx={{ maxHeight: "250px", overflowY: "auto", pr: 1 }}>
                  {/* Scrollable Box */}
                  {events.map((event, index) => (
                    <Card
                      key={index}
                      sx={{
                        mb: 2,
                        borderRadius: "8px",
                        boxShadow: "none",
                        border: "1px solid #e0e0e0",
                        "&:hover": {
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        },
                      }}
                    >
                      <CardContent>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: "bold" }}
                        >
                          {event.title}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Date:</strong>{" "}
                          {new Date(event.event_date).toDateString()}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Time:</strong> {formatTime(event.event_time)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Description:</strong>{" "}
                          {event.description
                            ? event.description
                            : "No description"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Creator:</strong>{" "}
                          {`${event.creator.first_name} ${event.creator.last_name}`}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Attendees:</strong>{" "}
                          {event.attendees
                            .map(
                              (attendee) =>
                                `${attendee.first_name} ${attendee.last_name}`
                            )
                            .join(", ")}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography>No events available.</Typography>
              )}
            </Box>
          )}

          {loadingEvents && <Typography>Loading events...</Typography>}
        </Box>
      )}

      {/* Render EventPlanner modal */}
      <EventPlanner
        open={openEventPlanner}
        handleClose={() => setOpenEventPlanner(false)}
        loadingUsers={loadingEvents}
        fetchEvents={fetchEvents}
      />
    </Box>
  );
};

// Define PropTypes for isExpanded and toggleSidebar
RightSidebar.propTypes = {
  isExpanded: PropTypes.bool.isRequired, // Boolean to determine expanded state
  toggleSidebar: PropTypes.func.isRequired, // Function to toggle sidebar
};

export default RightSidebar;
