import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import { Visibility } from "@mui/icons-material"; // Import the Visibility icon
import axios from "axios"; // Ensure axios is imported for API requests
import config from "../../../config/config";

const DocumentTracking = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]); // To store filtered documents
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [error, setError] = useState(null); // Added error state
  const [searchQuery, setSearchQuery] = useState("");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await axios.get(`${config.API}/documents`);
        const allDocuments = response.data.documents;

        // Log the API response
        console.log("All Documents:", allDocuments);

        // Ensure userId is a string for consistent comparison
        const userIdString = userId.toString();

        // Filter documents where sender_id matches userId
        const userDocuments = allDocuments.filter(
          (doc) => doc.sender_id.toString() === userIdString
        );

        // Log the sender_id of each filtered document
        userDocuments.forEach((doc) => {
          console.log("Sender ID:", doc.sender_id);
        });

        // Log the filtered user documents
        console.log("Filtered User Documents:", userDocuments);

        setDocuments(userDocuments);
        setFilteredDocuments(userDocuments);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };

    console.log("User ID:", userId);
    if (userId) {
      fetchDocuments();
    } else {
      console.log("No userId found in localStorage");
    }
  }, [userId]);

  const handleViewClick = async (documentCode) => {
    setDialogLoading(true);
    setError(null); // Clear previous errors
    try {
      const response = await axios.get(
        `${config.API}/document-tracking/${documentCode}`
      );
      setSelectedDocument(response.data);
      setOpenDialog(true);
    } catch (error) {
      console.error("Error fetching document details:", error);
      setError("Failed to load document details.");
    } finally {
      setDialogLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDocument(null);
  };

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);

    // Filter documents based on document_code
    const filtered = documents.filter((doc) =>
      doc.document_code.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredDocuments(filtered);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Typography variant="h6">Loading documents...</Typography>
      </Box>
    );
  }

  return (
    <Box padding={3}>
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
          Document Tracking
        </Typography>
        <TextField
          variant="outlined"
          placeholder="Search Doc No."
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{
            bgcolor: "#f0f2f5",
            borderRadius: 1,
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "#ddd",
              },
              "&:hover fieldset": {
                borderColor: "#ccc",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#bbb",
              },
            },
            ml: 2,
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Document ID</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Sender</TableCell>
              <TableCell>Date Sent</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDocuments.map((doc) => (
              <TableRow key={doc.document_code}>
                <TableCell>{doc.document_code}</TableCell>
                <TableCell>{doc.subject}</TableCell>
                <TableCell>{doc.prioritization || "N/A"}</TableCell>
                <TableCell>
                  {doc.sender_name} ({doc.sender_email})
                </TableCell>
                <TableCell>
                  {new Date(doc.date_of_letter).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleViewClick(doc.document_code)}
                    sx={{
                      mr: 1,
                      bgcolor: "#0A2841",
                      color: "#fff",
                      "&:hover": {
                        bgcolor: "#007BFF",
                      },
                    }}
                  >
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog to show document details */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth={true} // Makes the dialog take the full width
        maxWidth="lg" // Sets a large width for the dialog
      >
        <DialogTitle>Document Track</DialogTitle>
        <DialogContent>
          {dialogLoading ? (
            <Typography>Loading document details...</Typography>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : selectedDocument && selectedDocument.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell sx={{ width: "180px" }}>Action Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedDocument.map((doc) => (
                    <TableRow key={doc.tracking_id}>
                      <TableCell>{doc.action}</TableCell>
                      <TableCell sx={{ width: "180px" }}>
                        {new Date(doc.action_date).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography>No actions available for this document.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentTracking;
