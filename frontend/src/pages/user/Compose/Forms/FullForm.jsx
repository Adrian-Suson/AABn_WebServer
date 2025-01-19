import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Box,
  TextField,
  Button,
  Typography,
  useMediaQuery,
  useTheme,
  Paper,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  Autocomplete,
  Snackbar,
  Alert,
  InputLabel,
  ListItemText,
  IconButton,
} from "@mui/material";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";
import CancelIcon from "@mui/icons-material/Cancel";
import { useFormik } from "formik";
import * as yup from "yup";
import config from "../../../../config/config";

const validationSchema = yup.object({
  documentId: yup.string().required("Document ID is required"), // New field validation
  sender: yup.object({
    name: yup.string().required("Sender's name is required"),
    email: yup
      .string()
      .email("Invalid email format")
      .required("Sender's email is required"),
  }),
  recipient: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required("Recipient's name is required"),
        email: yup
          .string()
          .email("Invalid email format")
          .required("Recipient's email is required"),
      })
    )
    .required("At least one recipient is required"),
  subject: yup.string().required("Subject is required"),
  description: yup.string().required("Description is required"),
  prioritization: yup.string().required("Prioritization is required"),
  dateOfLetter: yup.date().required("Date of letter is required"),
  classification: yup.string().required("Classification is required"),
  deadline: yup.date().required("Deadline is required"),
});

function FullForm() {
  const [file, setFile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const isFetched = useRef({ userProfile: false, profiles: false });
  const theme = useTheme();
  const [selectAll, setSelectAll] = useState(false);
  const isNonMediumScreens = useMediaQuery(theme.breakpoints.up("md"));

  const formik = useFormik({
    initialValues: {
      documentId: "",
      sender: { name: "", email: "" },
      recipient: [],
      subject: "",
      description: "",
      prioritization: "Precedence",
      dateOfLetter: new Date().toISOString().split("T")[0],
      classification: "Confidential",
      deadline: new Date().toISOString().split("T")[0],
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const data = new FormData();
        Object.keys(values).forEach((key) => {
          if (key === "recipient" || key === "sender") {
            data.append(key, JSON.stringify(values[key]));
          } else {
            data.append(key, values[key]);
          }
        });

        if (file) {
          data.append("file", file);
        }

        const response = await axios.post(`${config.API}/submit-form`, data);
        if (response.status === 201) {
          setSnackbar({
            open: true,
            message: "Form Submitted Successfully",
            severity: "success",
          });
          formik.resetForm();
          setFile(null);
          setSelectAll(false);
          window.location.reload();
        } else {
          setSnackbar({
            open: true,
            message: "Form Submission Failed",
            severity: "error",
          });
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: "An error occurred during submission",
          severity: "error",
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const fetchUserProfile = useCallback(
    async (userId) => {
      if (isFetched.current.userProfile) return;
      try {
        const response = await axios.get(`${config.API}/profile/${userId}`);
        if (response.status === 200) {
          const data = response.data;
          formik.setFieldValue(
            "sender.name",
            `${data.profile.first_name} ${data.profile.last_name}`
          );
          formik.setFieldValue("sender.email", data.profile.email);
          isFetched.current.userProfile = true;
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    },
    [formik]
  );

  const fetchProfiles = useCallback(async () => {
    if (isFetched.current.profiles) return;
    try {
      const response = await axios.get(`${config.API}/users`);
      if (response.status === 200) {
        const useremail = localStorage.getItem("email");
        const filteredProfiles = response.data.users.filter(
          (profile) => profile.email !== useremail
        );
        setProfiles(filteredProfiles);
        isFetched.current.profiles = true;
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
    }
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      fetchUserProfile(userId);
      fetchProfiles();
    }
  }, [fetchUserProfile, fetchProfiles]);

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleSelectAllChange = (event, value) => {
    if (value.includes("select-all")) {
      if (selectAll) {
        formik.setFieldValue("recipient", []);
        setSelectAll(false);
      } else {
        formik.setFieldValue(
          "recipient",
          profiles.map((profile) => ({
            name: `${profile.first_name} ${profile.last_name}`,
            email: profile.email,
          }))
        );
        setSelectAll(true);
      }
    } else {
      setSelectAll(false);
      formik.setFieldValue(
        "recipient",
        value
          .filter((v) => v !== "select-all")
          .map((profile) => ({
            name: `${profile.first_name} ${profile.last_name}`,
            email: profile.email,
          }))
      );
    }
  };

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      setFile(selectedFile);
      setSnackbar({
        open: true,
        message: "File uploaded successfully!",
        severity: "success",
      });
    } else {
      setFile(null);
      setSnackbar({
        open: true,
        message: "No file selected. Please select a file to upload.",
        severity: "warning",
      });
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: "100%",
        padding: 3,
        borderRadius: 2,
        backgroundColor: "#FFFFFF",
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Box
        sx={{
          backgroundColor: "#003355",
          color: "#ffffff",
          padding: "10px",
          borderRadius: 1,
          mb: 2,
        }}
      >
        <Typography variant="h6">Add Detail</Typography>
      </Box>

      <form onSubmit={formik.handleSubmit}>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            label="Document ID" // New field label
            size="small"
            value={formik.values.documentId} // Bind to new field
            onChange={formik.handleChange}
            name="documentId" // Bind to new field
            sx={{
              backgroundColor: "transparent",
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#ccc",
                },
                "&:hover fieldset": {
                  borderColor: "#aaa",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#888",
                },
              },
            }}
            inputProps={{ style: { color: "#333" } }}
            error={Boolean(
              formik.touched.documentId && formik.errors.documentId
            )}
            helperText={formik.touched.documentId && formik.errors.documentId}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: isNonMediumScreens ? "row" : "column",
            gap: 2,
            mb: 2,
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            label="Sender Name"
            size="small"
            value={formik.values.sender.name}
            onChange={formik.handleChange}
            name="sender.name"
            sx={{
              backgroundColor: "transparent",
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#ccc",
                },
                "&:hover fieldset": {
                  borderColor: "#aaa",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#888",
                },
              },
            }}
            inputProps={{ style: { color: "#333" } }}
            disabled
          />
          <Autocomplete
            multiple
            fullWidth
            options={["select-all", ...profiles]}
            getOptionLabel={(option) =>
              option === "select-all"
                ? "Select All"
                : `${option.first_name} ${option.last_name} (${option.email})`
            }
            value={profiles
              .filter((profile) =>
                formik.values.recipient
                  .map((rec) => rec.email)
                  .includes(profile.email)
              )
              .concat(
                formik.values.recipient.some(
                  (rec) => rec.email === "select-all"
                )
                  ? ["select-all"]
                  : []
              )}
            onChange={(event, value) => handleSelectAllChange(event, value)}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Recipient"
                placeholder="Search by name or email"
                size="small"
                sx={{
                  backgroundColor: "transparent",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#ccc",
                    },
                    "&:hover fieldset": {
                      borderColor: "#aaa",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#888",
                    },
                  },
                }}
                inputProps={{ ...params.inputProps, style: { color: "#333" } }}
                error={Boolean(
                  formik.touched.recipient && formik.errors.recipient
                )}
                helperText={formik.touched.recipient && formik.errors.recipient}
              />
            )}
            renderOption={(props, option, { selected }) => (
              <MenuItem
                {...props}
                key={option === "select-all" ? "select-all" : option.email}
              >
                <Checkbox
                  checked={option === "select-all" ? selectAll : selected}
                />
                <ListItemText
                  primary={
                    option === "select-all"
                      ? "Select All"
                      : `${option.first_name} ${option.last_name}`
                  }
                  secondary={option === "select-all" ? null : option.email}
                />
              </MenuItem>
            )}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            label="Subject"
            size="small"
            value={formik.values.subject}
            onChange={formik.handleChange}
            name="subject"
            sx={{
              backgroundColor: "transparent",
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#ccc",
                },
                "&:hover fieldset": {
                  borderColor: "#aaa",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#888",
                },
              },
            }}
            inputProps={{ style: { color: "#333" } }}
            error={Boolean(formik.touched.subject && formik.errors.subject)}
            helperText={formik.touched.subject && formik.errors.subject}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            label="Description"
            size="small"
            value={formik.values.description}
            onChange={formik.handleChange}
            name="description"
            sx={{
              backgroundColor: "transparent",
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#ccc",
                },
                "&:hover fieldset": {
                  borderColor: "#aaa",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#888",
                },
              },
            }}
            inputProps={{ style: { color: "#333" } }}
            error={Boolean(
              formik.touched.description && formik.errors.description
            )}
            helperText={formik.touched.description && formik.errors.description}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: isNonMediumScreens ? "row" : "column",
            gap: 2,
            mb: 3,
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            label="Date of Letter"
            size="small"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formik.values.dateOfLetter}
            onChange={formik.handleChange}
            name="dateOfLetter"
            sx={{
              backgroundColor: "transparent",
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#ccc",
                },
                "&:hover fieldset": {
                  borderColor: "#aaa",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#888",
                },
              },
            }}
            error={Boolean(
              formik.touched.dateOfLetter && formik.errors.dateOfLetter
            )}
            helperText={
              formik.touched.dateOfLetter && formik.errors.dateOfLetter
            }
          />
          <TextField
            fullWidth
            variant="outlined"
            label="Deadline"
            size="small"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formik.values.deadline}
            onChange={formik.handleChange}
            name="deadline"
            sx={{
              backgroundColor: "transparent",
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#ccc",
                },
                "&:hover fieldset": {
                  borderColor: "#aaa",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#888",
                },
              },
            }}
            inputProps={{
              style: { color: "#333" },
              min: new Date().toISOString().split("T")[0],
            }} // Prevent past dates
            error={Boolean(formik.touched.deadline && formik.errors.deadline)}
            helperText={formik.touched.deadline && formik.errors.deadline}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: isNonMediumScreens ? "row" : "column",
            gap: 2,
            mb: 3,
          }}
        >
          <FormControl
            fullWidth
            error={Boolean(
              formik.touched.prioritization && formik.errors.prioritization
            )}
          >
            <InputLabel size="small">Priority </InputLabel>
            <Select
              variant="outlined"
              size="small"
              label="Priority "
              value={formik.values.prioritization}
              onChange={formik.handleChange}
              name="prioritization"
              sx={{
                backgroundColor: "transparent",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#ccc",
                  },
                  "&:hover fieldset": {
                    borderColor: "#aaa",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#888",
                  },
                },
              }}
              inputProps={{ style: { color: "#333" } }}
            >
              <MenuItem sx={{ color: "#333" }} value="Precedence">
                Precedence -P-
              </MenuItem>
              <MenuItem sx={{ color: "#333" }} value="Oscar">
                Oscar -O-
              </MenuItem>
              <MenuItem sx={{ color: "#333" }} value="Zulo">
                Zulo -Z-
              </MenuItem>
            </Select>
            {formik.touched.prioritization && formik.errors.prioritization && (
              <Typography variant="body2" color="error">
                {formik.errors.prioritization}
              </Typography>
            )}
          </FormControl>
          <FormControl
            fullWidth
            error={Boolean(
              formik.touched.classification && formik.errors.classification
            )}
          >
            <InputLabel size="small">Classification</InputLabel>
            <Select
              variant="outlined"
              size="small"
              label="Classification"
              value={formik.values.classification}
              onChange={formik.handleChange}
              name="classification"
              sx={{
                backgroundColor: "transparent",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#ccc",
                  },
                  "&:hover fieldset": {
                    borderColor: "#aaa",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#888",
                  },
                },
              }}
              inputProps={{ style: { color: "#333" } }}
            >
              <MenuItem sx={{ color: "#333" }} value="Confidential">
                Confidential
              </MenuItem>
              <MenuItem sx={{ color: "#333" }} value="Un-Classified">
                Un-Classified
              </MenuItem>
            </Select>
            {formik.touched.classification && formik.errors.classification && (
              <Typography variant="body2" color="error">
                {formik.errors.classification}
              </Typography>
            )}
          </FormControl>
        </Box>

        <Box
          sx={{
            backgroundColor: "#003355",
            color: "#fff",
            padding: "10px",
            borderRadius: 1,
            mb: 2,
          }}
        >
          <Typography variant="h6">Add Attachments</Typography>
        </Box>
        <Box>
          <Box display="flex" alignItems="center">
            <Button
              variant="contained"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{
                mr: 2,
                bgcolor: "#FFA000",
                "&:hover": { bgcolor: "#FFB233" },
              }}
            >
              Choose File
              <input
                type="file"
                hidden
                onChange={handleFileUpload}
                // Removed the accept attribute to allow all file types
              />
            </Button>
            {file && (
              <Typography variant="body1" sx={{ color: "#333" }}>
                {file.name}
                <IconButton
                  onClick={() => {
                    setFile(null); // Clear the file state
                    setSnackbar({
                      open: true,
                      message: "File removed.",
                      severity: "info",
                    });
                  }}
                  size="small"
                  sx={{ ml: 1 }}
                >
                  <CancelIcon />
                </IconButton>
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ bgcolor: "#0A2841", "&:hover": { bgcolor: "#142b49" } }}
          >
            Send
          </Button>
        </Box>
      </form>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

export default FullForm;
