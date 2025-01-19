import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
  Box,
} from "@mui/material";
import axios from "axios";
import config from "../../../config/config";

const ForwardDialog = ({ documentCode }) => {
  const [open, setOpen] = useState(false);
  const [forwardToEmail, setForwardToEmail] = useState("");
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [forwarding, setForwarding] = useState(false); // Track forwarding state
  const userEmail = localStorage.getItem("email");
  const [snackbarOpen, setSnackbarOpen] = useState(false); // Snackbar visibility
  const [snackbarMessage, setSnackbarMessage] = useState(""); // Dynamic message for success/error

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setForwardToEmail("");
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return; // Prevent closing on clickaway
    setSnackbarOpen(false);
  };

  const handleForward = async () => {
    setForwarding(true); // Disable button during forwarding
    try {
      const response = await axios.post(
        `${config.API}/forward-document/${documentCode}`,
        {
          recipientEmail: forwardToEmail,
        }
      );
      if (response.data.success) {
        setSnackbarMessage("Document forwarded successfully!");
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage(
          response.data.message || "Failed to forward document."
        );
        setSnackbarOpen(true); // Show snackbar when there's an error
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Error forwarding document. Please try again.";
      setSnackbarMessage(errorMessage); // Show error in Snackbar
      setSnackbarOpen(true);
    } finally {
      setForwarding(false); // Re-enable button
      handleClose(); // Close dialog after attempting to forward
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${config.API}/users`);
      if (response.data.success) {
        const filteredUsers = response.data.users.filter(
          (user) => user.email !== userEmail
        );
        setUserList(filteredUsers);
        if (filteredUsers.length === 0) {
          setSnackbarMessage("No users available.");
          setSnackbarOpen(true);
        }
      } else {
        setSnackbarMessage(response.data.message || "Failed to fetch users.");
        setSnackbarOpen(true);
      }
    } catch (error) {
      setSnackbarMessage("Error fetching users. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, fetchUsers]);

  return (
    <div>
      <Button variant="contained" color="primary" onClick={handleClickOpen}>
        Forward Document
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{ style: { width: "600px", maxWidth: "80%" } }}
      >
        <DialogTitle>Forward Document To User</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress />
            </Box>
          ) : userList.length > 0 ? (
            <Autocomplete
              options={userList}
              getOptionLabel={(option) =>
                `${option.first_name} ${option.last_name} (${option.email})`
              }
              onChange={(event, newValue) => {
                setForwardToEmail(newValue ? newValue.email : "");
              }}
              renderInput={({ InputProps, ...params }) => (
                <TextField
                  {...params}
                  label="Select Recipient"
                  placeholder="Search by name or email"
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2, mb: 2 }}
                  InputProps={{
                    ...InputProps,
                    endAdornment: (
                      <>
                        {loading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          ) : (
            <Typography color="error">
              No users available for forwarding.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleForward}
            color="primary"
            disabled={!forwardToEmail || forwarding} // Disable if no email or while forwarding
          >
            {forwarding ? <CircularProgress size={20} /> : "Forward"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar to show errors or success */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }} // Positioned correctly
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarMessage ? "error" : "success"} // Change severity based on the type
          sx={{ width: "100%" }}
        >
          {snackbarMessage || "An unknown error occurred."}
        </Alert>
      </Snackbar>
    </div>
  );
};

ForwardDialog.propTypes = {
  documentCode: PropTypes.string.isRequired,
};

export default ForwardDialog;
