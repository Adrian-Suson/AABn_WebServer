import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Button,
  Modal,
  Fade,
  Backdrop,
  Divider,
  Tabs,
  Tab,
  TableContainer,
  Table,
  TableHead,
  TableCell,
  TableRow,
  TableBody,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";
import config from "../../../config/config";
import "bootstrap/dist/css/bootstrap.min.css";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "S6", // Updated default role
  });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.API}/users`);
      setUsers(response.data.users);
    } catch (error) {
      setSnackbarMessage("Failed to fetch users.");
      setSnackbarSeverity("error");
      setShowSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleViewClick = async (user) => {
    try {
      const response = await axios.get(`${config.API}/users/${user.userId}`);
      setSelectedUser(response.data.user);
      setModalOpen(true);
    } catch (error) {
      setSnackbarMessage("Failed to fetch user details.");
      setSnackbarSeverity("error");
      setShowSnackbar(true);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      console.log("Selected User Data:", selectedUser);
      console.log("Image URL:", selectedUser.image_url);
    }
  }, [selectedUser]);

  const handleDeleteClick = async (userId) => {
    try {
      await axios.delete(`${config.API}/users/${userId}`);
      setUsers(users.filter((user) => user.userId !== userId));
      setSnackbarMessage("User deleted successfully!");
      setSnackbarSeverity("success");
      setShowSnackbar(true);
    } catch (error) {
      setSnackbarMessage("Failed to delete user.");
      setSnackbarSeverity("error");
      setShowSnackbar(true);
    }
  };

  const handleAddUser = async () => {
    try {
      await axios.post(`${config.API}/register`, {
        username: newUser.username,
        password: newUser.password,
        role: newUser.role,
      });
      await fetchUsers();
      setNewUser({
        username: "",
        password: "",
        role: "S6", // Reset to updated default role
      });
      setAddModalOpen(false);
      setSnackbarMessage("User added successfully!");
      setSnackbarSeverity("success");
      setShowSnackbar(true);
    } catch (error) {
      setSnackbarMessage("Failed to add user.");
      setSnackbarSeverity("error");
      setShowSnackbar(true);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  const handleAddModalClose = () => {
    setAddModalOpen(false);
    setNewUser({
      username: "",
      password: "",
      role: "S6",
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filterUsers = () => {
    const roleMap = ["S1", "S2", "S3", "S4", "S6"];
    const selectedRole = roleMap[tabValue];
    return users.filter((user) => user.role === selectedRole);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", padding: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3} sx={{ backgroundColor: "#f8f8f8", minHeight: "100vh" }}>
      <Box
        mb={2}
        p={2}
        bgcolor="#ffffff"
        display="flex"
        alignItems="center"
        borderRadius={2}
        boxShadow={1}
      >
        <Typography variant="h5" sx={{ color: "#333" }} flexGrow={1}>
          User Management
        </Typography>
        <Button
          variant="contained"
          sx={{
            bgcolor: "#0A2841",
            color: "white",
            textTransform: "none",
            "&:hover": {
              bgcolor: "#142b49",
            },
          }}
          onClick={() => setAddModalOpen(true)}
        >
          Add User
        </Button>
      </Box>
      <Box mb={2} p={2} bgcolor="#ffffff" borderRadius={2} boxShadow={1}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="S1" />
          <Tab label="S2" />
          <Tab label="S3" />
          <Tab label="S4" />
          <Tab label="S6" />
        </Tabs>
        <Box>
          {filterUsers().length > 0 ? (
            <TableContainer
              component={Paper}
              sx={{
                maxHeight: "65vh",
                overflowY: "auto",
                padding: 2,
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filterUsers().map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            bgcolor: "#0A2841",
                            color: "white",
                            textTransform: "none",
                            padding: "5px 15px",
                            fontSize: "0.875rem",
                            "&:hover": {
                              bgcolor: "#142b49",
                            },
                          }}
                          onClick={() => handleViewClick(user)}
                        >
                          View
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          sx={{
                            ml: 1,
                            textTransform: "none",
                            padding: "5px 15px",
                            fontSize: "0.875rem",
                          }}
                          onClick={() => handleDeleteClick(user.userId)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography
              variant="body2"
              sx={{ textAlign: "center", color: "#777" }}
            >
              No users found.
            </Typography>
          )}
        </Box>
      </Box>
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={modalOpen}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "60%",
              maxWidth: 450,
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: 24,
              p: 3,
            }}
          >
            {selectedUser && (
              <>
                <Box display="flex" flexDirection="column">
                  <Typography
                    variant="h6"
                    sx={{
                      p: 2,
                      bgcolor: "#0A2841",
                      color: "white",
                      borderRadius: 1,
                      width: "100%",
                    }}
                  >
                    User Details
                  </Typography>

                  <Divider
                    sx={{ my: 2, bgcolor: "rgba(255, 255, 255, 0.2)" }}
                  />

                  <Typography>
                    <strong>Full Name:</strong>{" "}
                    {`${selectedUser.first_name} ${selectedUser.last_name}`}
                  </Typography>
                  <Typography>
                    <strong>Email:</strong> {selectedUser.email}
                  </Typography>
                  <Typography>
                    <strong>Role:</strong> {selectedUser.role}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </Fade>
      </Modal>
      <Modal
        open={addModalOpen}
        onClose={handleAddModalClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={addModalOpen}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "60%",
              maxWidth: 450,
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: 24,
              p: 3,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2 }}>
              Add User
            </Typography>
            <TextField
              label="Username"
              fullWidth
              value={newUser.username}
              onChange={(e) =>
                setNewUser({ ...newUser, username: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="role-select-label">Role</InputLabel>
              <Select
                labelId="role-select-label"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
              >
                <MenuItem value="S6">S6</MenuItem>
                <MenuItem value="S1">S1</MenuItem>
                <MenuItem value="S2">S2</MenuItem>
                <MenuItem value="S3">S3</MenuItem>
                <MenuItem value="S4">S4</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={handleAddUser}
              sx={{
                bgcolor: "#0A2841",
                color: "white",
                textTransform: "none",
                "&:hover": {
                  bgcolor: "#142b49",
                },
              }}
            >
              Add User
            </Button>
          </Box>
        </Fade>
      </Modal>
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSnackbar(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
