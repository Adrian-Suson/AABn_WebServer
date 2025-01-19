import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
  Button,
  Tab,
  Tabs,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Skeleton,
  Badge,
} from "@mui/material";
import axios from "axios";
import DownloadIcon from "@mui/icons-material/Download";
import config from "../../../config/config";
import ReplyDialog from "./ReplyDialog";
import DocumentDialog from "./DocumentDialog";
import useFetchReplies from "../../../hooks/useFetchReplies";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  fetchUnseenRepliesCountReceiver,
  useUnseenRepliesReceiver,
} from "../../../hooks/UnseenRepliesContextReceiver";

function Incoming() {
  const [selectedTab, setSelectedTab] = useState(1);
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [reply, setReply] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const userEmail = localStorage.getItem("email");
  const userId = localStorage.getItem("userId");
  const { replies, unseenCounts, fetchReplies } = useFetchReplies();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [counts, setCounts] = useState({ all: 0, pending: 0, received: 0 });
  const { setUnseenRepliesCountReceiver } = useUnseenRepliesReceiver();

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${config.API}/get-documents/${userEmail}`
      );
      // Format the documents with required date properties
      const userSpecificDocuments = response.data.map((doc) => ({
        ...doc,
        date_of_letter: new Date(doc.date_of_letter).toLocaleDateString(),
        created_at: new Date(doc.created_at).toLocaleTimeString(),
      }));

      setDocuments(userSpecificDocuments);
      setFilteredDocuments(userSpecificDocuments);

      const allCount = userSpecificDocuments.length;
      const pendingCount = userSpecificDocuments.filter(
        (doc) => doc.recipient_status === "Pending"
      ).length;
      const receivedCount = userSpecificDocuments.filter(
        (doc) => doc.recipient_status === "Received"
      ).length;

      setCounts({
        all: allCount,
        pending: pendingCount,
        received: receivedCount,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setError("Failed to fetch documents. Please try again later.");
      setLoading(false);
    }
  }, [userEmail]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    filterDocumentsByTab(newValue, searchQuery);
  };

  const filterDocumentsByTab = (tabIndex, query) => {
    let filtered = documents;

    switch (tabIndex) {
      case 1:
        filtered = documents.filter(
          (doc) => doc.recipient_status === "Pending"
        );
        break;
      case 2:
        filtered = documents.filter(
          (doc) => doc.recipient_status === "Received"
        );
        break;
      default:
        break;
    }

    if (query) {
      filtered = filtered.filter((doc) => doc.document_code.includes(query));
    }

    setFilteredDocuments(filtered);
    setPage(1);
  };

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    filterDocumentsByTab(selectedTab, query);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    const fetchAllReplies = async () => {
      if (!documents || documents.length === 0) {
        console.warn("No rows available to fetch replies.");
        return;
      }

      const fetchPromises = documents.map((row) =>
        fetchReplies(row.document_id)
      );
      await Promise.all(fetchPromises);

      // Update the unseen replies count after fetching replies
      const count = await fetchUnseenRepliesCountReceiver();
      setUnseenRepliesCountReceiver(count);
    };

    if (documents.length > 0) {
      fetchAllReplies();
    }
  }, [documents, fetchReplies, setUnseenRepliesCountReceiver]);

  const handleViewDocument = async (document) => {
    await fetchReplies(document.document_id);
    setSelectedDocument(document);
    setModalOpen(true);

    if (document.recipient_status === "Pending") {
      try {
        await axios.put(
          `${config.API}/update-recipient-status/${document.document_code}`,
          {
            recipient_email: userEmail,
            status: "Received",
            userId: userId,
          }
        );

        setDocuments((prevDocuments) =>
          prevDocuments.map((doc) =>
            doc.document_id === document.document_code
              ? { ...doc, recipient_status: "Received" }
              : doc
          )
        );

        setCounts((prevCounts) => ({
          ...prevCounts,
          pending: prevCounts.pending - 1,
          received: prevCounts.received + 1,
        }));
      } catch (error) {
        console.error("Error updating document status:", error);
        alert("Failed to update document status. Please try again.");
      }
    }

    console.log("userId:", userId);
    console.log("Document ID:", document.document_code);

    try {
      await axios.post(`${config.API}/mark-replies-seen/${userId}`, {
        document_id: document.document_id, // This should send the Document ID
      });
    } catch (error) {
      console.error("Error marking replies as seen:", error);
    }
  };

  const handleArchiveDocument = async (documentCode) => {
    try {
      await axios.put(`${config.API}/update-recipient-status/${documentCode}`, {
        recipient_email: userEmail,
        status: "Archived",
      });

      setDocuments((prevDocuments) =>
        prevDocuments.map((doc) =>
          doc.document_code === documentCode
            ? { ...doc, recipient_status: "Archived" }
            : doc
        )
      );
      fetchDocuments();
      setModalOpen(false);
      filterDocumentsByTab(selectedTab, searchQuery);

      setCounts((prevCounts) => ({
        ...prevCounts,
        received: prevCounts.received - 1,
      }));
    } catch (error) {
      console.error("Error archiving document status:", error);
      alert("Failed to archive the document. Please try again.");
    }
  };

  const handleDeleteRecipient = async (documentId) => {
    const storedEmail = localStorage.getItem("email");
    try {
      await axios.delete(
        `${config.API}/delete-recipient/${documentId}/${storedEmail}`
      );

      setSnackbarMessage("Recipient deleted successfully!", "error");
      setSnackbarOpen(true);
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting recipient:", error);
      setSnackbarMessage("Failed to delete recipient. Please try again.");
      setSnackbarOpen(true);
    }
  };

  const handleCloseModal = async () => {
    setModalOpen(false);
    setSelectedDocument(null);

    await fetchDocuments();
    filterDocumentsByTab(selectedTab, searchQuery);
    const fetchAllReplies = async () => {
      if (!documents || documents.length === 0) {
        console.warn("No rows available to fetch replies.");
        return;
      }

      const fetchPromises = documents.map((row) =>
        fetchReplies(row.document_id)
      );
      await Promise.all(fetchPromises);
    };

    if (documents.length > 0) {
      fetchAllReplies();
    }

    // Update the unseen replies count after fetching replies
    const count = await fetchUnseenRepliesCountReceiver();
    setUnseenRepliesCountReceiver(count);

    window.location.reload();
  };

  const handleDownloadDocument = (fileName) => {
    window.open(`${config.API}/documents/${fileName}`, "_blank");
  };

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedDocuments = filteredDocuments.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleReplyDialogOpen = () => {
    setReply(selectedDocument);
    console.log("Docs:", selectedDocument);
    setReplyDialogOpen(true);
  };

  const handleReplyDialogClose = () => {
    setReplyDialogOpen(false);
  };

  const handleReplySuccess = async () => {
    await fetchDocuments();
    // Update the unseen replies count after fetching replies
    const count = await fetchUnseenRepliesCountReceiver();
    setUnseenRepliesCountReceiver(count);
  };

  return (
    <Box
      p={3}
      sx={{
        backgroundColor: "#f9f9f9",
        minHeight: "100vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        mb={2}
        p={2}
        sx={{
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: { xs: "column", md: "row" }, // Adjust flex direction for responsiveness
          alignItems: "center",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: "#333",
            flexGrow: 1,
            textAlign: { xs: "center", md: "left" }, // Center align on small screens
            mb: { xs: 2, md: 0 },
          }}
        >
          Incoming Documents
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

      <Paper
        sx={{
          borderRadius: 2,
          boxShadow: 1,
          backgroundColor: "#ffffff",
          padding: 2,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              color: "#555",
              fontWeight: "bold",
              fontSize: { xs: "12px", md: "14px" },
            },
            "& .Mui-selected": {
              color: "#0A2841",
            },
          }}
        >
          <Tab label={`All (${counts.all})`} />
          <Tab label={`Pending (${counts.pending})`} />
          <Tab label={`Received (${counts.received})`} />
        </Tabs>

        {loading ? (
          <Box sx={{ padding: 4 }}>
            <Skeleton variant="text" width="80%" height={30} />
            <Skeleton variant="rectangular" height={100} sx={{ mt: 2 }} />
            <Skeleton variant="text" width="50%" height={30} sx={{ mt: 2 }} />
            <Skeleton variant="text" width="60%" height={30} sx={{ mt: 2 }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ textAlign: "center", mb: 2 }}>
            {error}
          </Alert>
        ) : filteredDocuments.length > 0 ? (
          <Box
            sx={{
              maxHeight: "65vh",
              overflowY: "auto",
            }}
          >
            <TableContainer component={Paper} sx={{ flexGrow: 1 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sender Name</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>Document Code</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedDocuments.map((doc) => (
                    <TableRow key={doc.document_id}>
                      <TableCell>{doc.sender_name}</TableCell>
                      <TableCell>{doc.details || doc.subject}</TableCell>
                      <TableCell>{doc.document_code}</TableCell>
                      <TableCell> {doc.recipient_status}</TableCell>
                      <TableCell>
                        {doc.date_of_letter},{" "}
                        <span style={{ fontSize: "0.8em" }}>
                          ({doc.created_at})
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          badgeContent={unseenCounts[doc.document_id] || 0}
                          color="error"
                        >
                          <Button
                            variant="contained"
                            size="small"
                            sx={{
                              color: "#0A2841",
                              bgcolor: "transparent",
                              boxShadow: "none",
                              "&:hover": {
                                color: "#007BFF",
                                bgcolor: "transparent",
                              },
                            }}
                            onClick={() => handleViewDocument(doc)}
                          >
                            <VisibilityIcon />
                          </Button>
                        </Badge>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            color: "#007BFF",
                            bgcolor: "transparent",
                            boxShadow: "none",
                            "&:hover": {
                              color: "#0A2841",
                              bgcolor: "transparent",
                            },
                          }}
                          onClick={() => handleDownloadDocument(doc.file_name)}
                        >
                          <DownloadIcon />
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            mr: 1,
                            color: "#d32f2f",
                            bgcolor: "transparent",
                            boxShadow: "none",
                            "&:hover": {
                              color: "#c62828",
                              bgcolor: "transparent",
                            },
                          }}
                          onClick={() => handleDeleteRecipient(doc.document_code)}
                        >
                          <DeleteIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{ textAlign: "center", color: "#555", mt: 2 }}
          >
            No documents found.
          </Typography>
        )}
      </Paper>

      <DocumentDialog
        open={modalOpen}
        handleClose={handleCloseModal}
        selectedDocument={selectedDocument}
        replies={replies}
        handleDownloadDocument={handleDownloadDocument}
        handleArchiveDocument={handleArchiveDocument}
        handleReplyDialogOpen={handleReplyDialogOpen}
      />

      {reply && (
        <ReplyDialog
          open={replyDialogOpen}
          onClose={handleReplyDialogClose}
          reply={reply}
          onReplySuccess={handleReplySuccess}
        />
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={"error"}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Incoming;
