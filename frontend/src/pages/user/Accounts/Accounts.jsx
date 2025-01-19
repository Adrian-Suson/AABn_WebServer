import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import config from "../../../config/config";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar,
  Snackbar,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const userId = localStorage.getItem("userId");

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${config.API}/profile/${userId}`);
      const profileData = response.data.profile;
      setProfile(profileData);
      setForm({
        email: profileData.email || "",
        username: profileData.username || "",
        firstName: profileData.first_name || "",
        lastName: profileData.last_name || "",
        phoneNumber: profileData.phone_number || "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      setSnackbar({
        open: true,
        message: "Failed to load profile.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (selectedImage) {
      const imagePreviewUrl = URL.createObjectURL(selectedImage);
      setSelectedImagePreview(imagePreviewUrl);

      return () => URL.revokeObjectURL(imagePreviewUrl);
    }
  }, [selectedImage]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSnackbar({ open: false, message: "", severity: "success" });

    if (form.password !== form.confirmPassword) {
      setSnackbar({
        open: true,
        message: "Passwords do not match.",
        severity: "error",
      });
      return;
    }

    const formData = new FormData();
    formData.append("email", form.email);
    formData.append("username", form.username);
    formData.append("firstName", form.firstName);
    formData.append("lastName", form.lastName);
    formData.append("phoneNumber", form.phoneNumber);

    if (form.password) {
      formData.append("password", form.password);
    }

    if (selectedImage) {
      formData.append("profilePic", selectedImage);
    } else if (profile.image_url) {
      formData.append("profilePic", profile.image_url);
    }

    try {
      await axios.put(`${config.API}/profile/${userId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSnackbar({
        open: true,
        message: "Profile updated successfully.",
        severity: "success",
      });
      setIsDialogOpen(false);
      fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      setSnackbar({
        open: true,
        message: "Failed to update profile.",
        severity: "error",
      });
    }
  };

  const handleDialogOpen = () => {
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Typography variant="h6" color="error" align="center">
        Failed to load profile.
      </Typography>
    );
  }

  const profileImageUrl =
    selectedImagePreview ||
    (profile.image_url
      ? `${config.API}/profile_picture/${profile.image_url}`
      : "/default-profile.png");

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Box p={3} boxShadow={3} borderRadius={2} bgcolor="background.paper">
        <Typography variant="h4" gutterBottom align="center">
          Profile Details
        </Typography>

        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Avatar
            src={profileImageUrl}
            alt="Profile Image"
            sx={{ width: 120, height: 120, mb: 2, border: "2px solid #3f51b5" }}
          />
          <Typography variant="body1">
            <strong>Email:</strong> {profile.email}
          </Typography>
          <Typography variant="body1">
            <strong>Username:</strong> {profile.username}
          </Typography>
          <Typography variant="body1">
            <strong>First Name:</strong> {profile.first_name}
          </Typography>
          <Typography variant="body1">
            <strong>Last Name:</strong> {profile.last_name}
          </Typography>
          <Typography variant="body1">
            <strong>Phone Number:</strong> {profile.phone_number}
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handleDialogOpen}
          sx={{ mb: 3 }}
          startIcon={<EditIcon />}
        >
          Edit Profile
        </Button>

        <Dialog
          open={isDialogOpen}
          onClose={handleDialogClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogContent dividers sx={{ overflowY: "auto", p: 3 }}>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              sx={{ mb: 3 }}
            >
              <Avatar
                src={selectedImagePreview || profileImageUrl}
                alt="Selected Image"
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2,
                  border: "2px solid #3f51b5",
                }}
              />
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadFileIcon />}
                sx={{ mt: 1 }}
              >
                Upload Profile Picture
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />
              </Button>
            </Box>
            <form onSubmit={handleSubmit}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                <TextField
                  label="Email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Phone Number"
                  type="text"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  fullWidth
                />
                <Box
                  display="flex"
                  flexDirection={{ xs: "column", sm: "row" }}
                  gap={2}
                >
                  <TextField
                    label="First Name"
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    fullWidth
                  />
                  <TextField
                    label="Last Name"
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    fullWidth
                  />
                </Box>
                <TextField
                  label="Username"
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  fullWidth
                />
                <TextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={togglePasswordVisibility}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    ),
                  }}
                />
                <TextField
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={toggleConfirmPasswordVisibility}>
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    ),
                  }}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                  mt: 3,
                }}
              >
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDialogClose}
                  startIcon={<CancelIcon />}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  startIcon={<SaveIcon />}
                >
                  Save
                </Button>
              </Box>
            </form>
          </DialogContent>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default Profile;
