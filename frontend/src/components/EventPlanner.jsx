import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  Autocomplete,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import PropTypes from "prop-types";
import axios from "axios";
import config from "../config/config";

const EventPlanner = ({ open, handleClose, loadingUsers, fetchEvents }) => {
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [attendees, setAttendees] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const userId = localStorage.getItem("userId");

  const roles = useMemo(() => {
    const uniqueRoles = [...new Set(users.map((user) => user.role))];
    const withoutS6 = uniqueRoles.filter((role) => role !== "S6");
    return [...withoutS6, "S6"];
  }, [users]);

  const handleRoleSelect = (role) => {
    const usersWithRole = users.filter((user) => user.role === role);
    setAttendees((prevAttendees) => {
      const updatedAttendees = [...prevAttendees];
      usersWithRole.forEach((user) => {
        if (!prevAttendees.some((attendee) => attendee.email === user.email)) {
          updatedAttendees.push(user);
        }
      });
      return updatedAttendees;
    });
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${config.API}/users`);
        setUsers(response.data.users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async () => {
    if (!eventTitle || !eventTime || !eventDate || attendees.length === 0) {
      setSnackbarMessage("Please fill out all fields before submitting.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);

    const eventData = {
      title: eventTitle,
      event_date: eventDate,
      event_time: eventTime,
      created_by: userId,
      attendees: attendees.map((user) => user.userId),
      description: description,
    };

    try {
      const response = await axios.post(`${config.API}/events`, eventData);

      if (response.status === 201) {
        setSnackbarMessage("Event created successfully");
        setSnackbarSeverity("success");
        fetchEvents && fetchEvents();
        setEventTitle("");
        setEventDate("");
        setEventTime("");
        setAttendees([]);
        setDescription("");
        handleClose();
      } else {
        setSnackbarMessage("Failed to create event. Please try again.");
        setSnackbarSeverity("error");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      setSnackbarMessage(
        error.response?.data?.message ||
          "An error occurred while creating the event."
      );
      setSnackbarSeverity("error");
    } finally {
      setLoading(false);
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 450,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
        }}
      >
        <Typography variant="h6" gutterBottom>
          {eventDate
            ? `Add Event for ${new Date(eventDate).toDateString()}`
            : "Select a date"}
        </Typography>

        {/* Event Title Input */}
        <TextField
          label="Event Title"
          fullWidth
          value={eventTitle}
          onChange={(e) => setEventTitle(e.target.value)}
          sx={{ mb: 2 }}
          required
        />

        {/* Event Date Input */}
        <TextField
          label="Event Date"
          type="date"
          fullWidth
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ mb: 2 }}
          required
        />

        {/* Event Time Input */}
        <TextField
          label="Event Time"
          type="time"
          fullWidth
          value={eventTime}
          onChange={(e) => setEventTime(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
          sx={{ mb: 2 }}
          required
        />

        {/* Event Description Input */}
        <TextField
          label="Event Description"
          fullWidth
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={3}
          sx={{ mb: 2 }}
          required
        />

        {/* Role Selection Buttons */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Select Role to Add Attendees:
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
          {roles.map((role) => (
            <Button
              key={role}
              variant="outlined"
              onClick={() => handleRoleSelect(role)}
            >
              {role} ({users.filter((user) => user.role === role).length})
            </Button>
          ))}
        </Box>

        {/* Attendees Input using Autocomplete */}
        <Autocomplete
          multiple
          options={users}
          getOptionLabel={(option) =>
            `${option.first_name} ${option.last_name} (${option.email})`
          }
          value={attendees}
          onChange={(event, newValue) => setAttendees(newValue)}
          loading={loadingUsers}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Attendees"
              placeholder="Select attendees"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingUsers ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ mb: 2 }}
          required
        />

        {/* Submit Button */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Event"}
        </Button>

        {/* Snackbar for Notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Modal>
  );
};

EventPlanner.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  loadingUsers: PropTypes.bool.isRequired,
  fetchEvents: PropTypes.func,
};

export default EventPlanner;
