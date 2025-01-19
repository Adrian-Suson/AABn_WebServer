import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
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
} from "@mui/material";
import axios from "axios";
import config from "../../../config/config";
import DownloadIcon from "@mui/icons-material/Download";

const Archive = () => {
  const [archivedDocuments, setArchivedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0); // Main tab index
  const [subTabValue, setSubTabValue] = useState(0); // Subtab index

  useEffect(() => {
    const fetchArchivedDocuments = async () => {
      try {
        setLoading(true);
        const email = localStorage.getItem("email");
        const response = await axios.get(
          `${config.API}/get-documents/${email}`
        );
        const allDocuments = response.data;
        const archivedDocuments = allDocuments.filter(
          (doc) => doc.recipient_status === "Archived"
        );
        setArchivedDocuments(archivedDocuments);
      } catch (error) {
        console.error("Error fetching archived documents:", error);
        setError("Failed to fetch archived documents. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedDocuments();
  }, []);

  const handleViewClick = (doc) => {
    setSelectedDocument(doc);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDocument(null);
  };

  const handleDownloadDocument = (fileName) => {
    if (!fileName) return;
    const fileUrl = `${config.API}/documents/${fileName}`;
    window.open(fileUrl, "_blank");
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSubTabValue(0);
  };

  const handleSubTabChange = (event, newValue) => {
    setSubTabValue(newValue);
  };

  const filterDocuments = () => {
    const filteredByPriority = (priority) =>
      archivedDocuments.filter((doc) => doc.prioritization === priority);

    const filteredByClassification = (classification) =>
      archivedDocuments.filter((doc) => doc.classification === classification);

    switch (tabValue) {
      case 0: // All tab
        return archivedDocuments;
      case 1: // Priority tab
        switch (subTabValue) {
          case 0:
            return filteredByPriority("Precedence");
          case 1:
            return filteredByPriority("Oscar");
          case 2:
            return filteredByPriority("Zulo");
          default:
            return archivedDocuments;
        }
      case 2: // Classification tab
        switch (subTabValue) {
          case 0:
            return filteredByClassification("Confidential");
          case 1:
            return filteredByClassification("Un-Classified");
          default:
            return archivedDocuments;
        }
      default:
        return archivedDocuments;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", padding: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ textAlign: "center", mb: 2 }}>
        {error}
      </Alert>
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
          Archived Documents
        </Typography>
      </Box>
      <Box mb={2} p={2} bgcolor="#ffffff" borderRadius={2} boxShadow={1}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="All" />
          <Tab label="Priority" />
          <Tab label="Classification" />
        </Tabs>
        <Tabs
          value={subTabValue}
          onChange={handleSubTabChange}
          sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
        >
          {tabValue === 1 && [
            <Tab key="precedence" label="Precedence" />,
            <Tab key="oscar" label="Oscar" />,
            <Tab key="zulo" label="Zulo" />,
          ]}
          {tabValue === 2 && [
            <Tab key="confidential" label="Confidential" />,
            <Tab key="unclassified" label="Un-Classified" />,
          ]}
        </Tabs>
        <Box>
          {filterDocuments().length > 0 ? (
            <TableContainer
              component={Paper}
              sx={{ maxHeight: "80vh", overflowY: "auto", padding: 2 }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sender Name</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>Document Code</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date of Letter</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filterDocuments().map((doc, index) => (
                    <TableRow key={index}>
                      <TableCell>{doc.sender_name}</TableCell>
                      <TableCell>{doc.details || doc.subject}</TableCell>
                      <TableCell>{doc.document_code}</TableCell>
                      <TableCell>{doc.recipient_status}</TableCell>
                      <TableCell>
                        {new Date(doc.date_of_letter).toLocaleDateString()}
                      </TableCell>
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
                          onClick={() => handleViewClick(doc)}
                        >
                          View
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
              No archived documents found.
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
              maxWidth: 800,
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: 24,
              p: 3,
            }}
          >
            {selectedDocument && (
              <>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  p={1}
                  sx={{ bgcolor: "#0A2841", color: "white", borderRadius: 1 }}
                >
                  <Typography variant="h6">
                    Status - {selectedDocument.recipient_status}
                  </Typography>
                  <Box sx={{ bgcolor: "#FFA000", p: 0.5, borderRadius: 1 }}>
                    <Typography variant="body2">
                      {selectedDocument.recipient_status}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Sender Details
                </Typography>
                <Box
                  display="grid"
                  gridTemplateColumns="repeat(2, 1fr)"
                  gap={2}
                >
                  <Box>
                    <Typography variant="body2">
                      <strong>Sender Name:</strong>{" "}
                      {selectedDocument.sender_name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Sender Email:</strong>{" "}
                      {selectedDocument.sender_email}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Document Details
                </Typography>
                <Box>
                  <Typography variant="body2">
                    <strong>Document Code:</strong>{" "}
                    {selectedDocument.document_code}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Details:</strong>{" "}
                    {selectedDocument.details || selectedDocument.subject}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Date of Letter:</strong>{" "}
                    {new Date(
                      selectedDocument.date_of_letter
                    ).toLocaleDateString()}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      bgcolor: "#0A2841",
                      color: "white",
                      textTransform: "none",
                      marginTop: 2,
                    }}
                    onClick={() =>
                      handleDownloadDocument(selectedDocument.file_name)
                    }
                    startIcon={<DownloadIcon />}
                  >
                    Download Document
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default Archive;
