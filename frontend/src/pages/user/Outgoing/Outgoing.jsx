import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  Alert,
  Divider,
  Badge,
  IconButton,
  Skeleton,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import axios from "axios";
import config from "../../../config/config";
import ReplyDialog from "./ReplyDialog";
import useFetchReplies from "../../../hooks/useFetchReplies";
import {
  fetchUnseenRepliesCountSender,
  useUnseenRepliesSender,
} from "../../../hooks/UnseenRepliesContextSender";

const Outgoing = () => {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const userEmail = localStorage.getItem("email");
  const { replies, unseenCounts, fetchReplies } = useFetchReplies();
  const { setUnseenRepliesCountSender } = useUnseenRepliesSender();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${config.API}/get-sent-documents/${userEmail}`
      );
      const documents = response.data;
      const formattedDocuments = documents.map((document) => ({
        type: "document",
        document_code: document.document_code,
        sender_id: document.sender_id,
        document_id: document.document_id,
        recipients: document.recipients.map((rec) => ({
          name: rec.name,
          status: rec.status,
        })),
        subject: document.subject,
        date_of_letter: new Date(document.date_of_letter).toLocaleDateString(),
        created_at: new Date(document.created_at).toLocaleTimeString(),
        sender: `${document.sender_name} (${userEmail})`,
        prioritization: document.prioritization,
        description: document.description,
        classification: document.classification,
        deadline: document.deadline
          ? new Date(document.deadline).toLocaleDateString()
          : "N/A",
        file_name: document.file_name || "N/A",
      }));

      setRows(formattedDocuments);
      console.log('formattedDocuments:', formattedDocuments)
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    const fetchDataAndSetRows = async () => {
      if (userEmail) {
        await fetchData();
      }
    };

    fetchDataAndSetRows();
  }, [userEmail, fetchData]);

  useEffect(() => {
    const fetchAllReplies = async () => {
      if (!rows || rows.length === 0) {
        console.warn("No rows available to fetch replies.");
        return;
      }

      const fetchPromises = rows.map((row) => fetchReplies(row.document_id));
      await Promise.all(fetchPromises);

      // Update the unseen replies count after fetching replies
      const count = await fetchUnseenRepliesCountSender();
      setUnseenRepliesCountSender(count);
    };

    if (rows.length > 0) {
      fetchAllReplies();
    }
  }, [rows, fetchReplies, setUnseenRepliesCountSender]); // Ensure fetchReplies is defined in the component's scope

  const handleReplyDialogOpen = () => {
    setReply(selectedItem);
    console.log("Docs:", selectedItem);
    setReplyDialogOpen(true);
  };

  const handleReplyDialogClose = () => {
    setReplyDialogOpen(false);
  };

  const handleClickOpen = async (row) => {
    setSelectedItem(row);
    fetchUnseenRepliesCountSender();
    setOpen(true);
    await fetchReplies(row.document_id);

    const userId = localStorage.getItem("userId");

    console.log("userId:", userId);
    console.log("Document ID:", row.document_id);

    try {
      await axios.post(`${config.API}/mark-replies-seen/${userId}`, {
        document_id: row.document_id, // This should send the Document ID
      });
    } catch (error) {
      console.error("Error marking replies as seen:", error);
    }
  };

  const handleClose = async () => {
    setOpen(false);
    setSelectedItem(null);

    if (selectedItem) {
      await fetchReplies(selectedItem.document_id);
    }

    // Update the unseen replies count after closing
    const count = await fetchUnseenRepliesCountSender();
    setUnseenRepliesCountSender(count);
  };

  const handleReplySuccess = async () => {
    if (selectedItem) {
      await fetchReplies(selectedItem.document_id);
    }
    // Update the unseen replies count after closing
    const count = await fetchUnseenRepliesCountSender();
    setUnseenRepliesCountSender(count);
  };

  const handleDownload = () => {
    if (selectedItem && selectedItem.file_name !== "N/A") {
      const fileUrl = `${config.API}/documents/${selectedItem.file_name}`;
      window.open(fileUrl, "_blank");
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#f0f0f0", minHeight: "100vh" }}>
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
          Outgoing Documents
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ padding: 4 }}>
          <Skeleton variant="text" width="80%" height={30} />
          <Skeleton variant="rectangular" height={100} sx={{ mt: 2 }} />
          <Skeleton variant="text" width="50%" height={30} sx={{ mt: 2 }} />
          <Skeleton variant="text" width="60%" height={30} sx={{ mt: 2 }} />
        </Box>
      ) : (
        <Box
          sx={{
            borderRadius: 2,
            boxShadow: 1,
            backgroundColor: "#ffffff",
            padding: 2,
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <TableContainer
            component={Paper}
            sx={{ maxWidth: "100%", overflowX: "auto" }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Doc No. Code
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Recipients
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Subject
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Date and Time
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Actions
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length > 0 ? (
                  rows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.document_code}</TableCell>
                      <TableCell>
                        {row.recipients.map((rec, idx) => (
                          <Typography key={idx} variant="body2">
                            {rec.name}: {rec.status}
                          </Typography>
                        ))}
                      </TableCell>
                      <TableCell>{row.subject}</TableCell>
                      <TableCell>
                        {row.date_of_letter},{" "}
                        <span style={{ fontSize: "0.8em" }}>
                          ({row.created_at})
                        </span>
                      </TableCell>
                      {/* Display created_at */}
                      <TableCell>
                        <Badge
                          badgeContent={unseenCounts[row.document_id] || 0}
                          color="error"
                        >
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleClickOpen(row)}
                          >
                            View
                          </Button>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 2 }}>
                      <Typography variant="body1" sx={{ color: "#888" }}>
                        No data available
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          {selectedItem ? (
            <div>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                p={2}
                sx={{ bgcolor: "#0A2841", color: "white", borderRadius: 1 }}
              >
                <Typography variant="h6">Document Details</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box mb={2}>
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
                      <strong>Sender Name:</strong> {selectedItem.sender}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Document Information
              </Typography>
              <Box
                display="grid"
                gridTemplateColumns="repeat(2, 1fr)"
                gap={2}
                mb={2}
              >
                <Box>
                  <Typography variant="body2">
                    <strong>Document Code:</strong> {selectedItem.document_code}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Subject:</strong> {selectedItem.subject}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Description:</strong> {selectedItem.description}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Prioritization:</strong>{" "}
                    {selectedItem.prioritization}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2">
                    <strong>Date And Time:</strong>{" "}
                    {selectedItem.date_of_letter},{" "}
                    <span style={{ fontSize: "0.8em" }}>
                      ({selectedItem.created_at})
                    </span>
                  </Typography>
                  <Typography variant="body2">
                    <strong>Classification:</strong>{" "}
                    {selectedItem.classification}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Deadline:</strong> {selectedItem.deadline}
                  </Typography>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2">
                      <strong>File Name:</strong> {selectedItem.file_name}
                    </Typography>
                    <IconButton
                      variant="contained"
                      size="small"
                      onClick={handleDownload}
                      hidden={selectedItem.file_name === "N/A"}
                      sx={{
                        ml: 2,
                        bgcolor: "#115293",
                        color: "white",
                        "&:hover": { bgcolor: "#1976d2" },
                      }}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Replies
              </Typography>
              {replies.length > 0 ? (
                replies.map((reply, index) => (
                  <Box
                    key={index}
                    mb={2}
                    sx={{
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      p: 2,
                      backgroundColor: "#f9f9f9",
                      boxShadow: 2,
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                      {reply.sender_name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {reply.reply_text}
                    </Typography>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="body2" sx={{ color: "#333" }}>
                        {reply.file_name}
                      </Typography>
                      {reply.file_name && (
                        <IconButton
                          variant="contained"
                          size="small"
                          onClick={() => window.open(reply.fileUrl, "_blank")}
                          sx={{
                            ml: 2,
                            bgcolor: "#1976d2",
                            color: "white",
                            "&:hover": { bgcolor: "#115293" },
                          }}
                        >
                          <DownloadIcon />
                        </IconButton>
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: "gray" }}>
                      Date of Reply: {reply.date_of_reply} {reply.created_at}{" "}
                      <span
                        style={{
                          fontWeight: reply.seen ? "normal" : "bold",
                          color: reply.seen ? "green" : "red",
                        }}
                      >
                        {reply.seen ? " (Seen)" : " (Not Seen)"}
                      </span>
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" sx={{ color: "#888" }}>
                  No replies available.
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />
            </div>
          ) : (
            <Typography>Loading...</Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            sx={{ bgcolor: "#0A2841", color: "white" }}
            onClick={handleReplyDialogOpen}
          >
            Reply
          </Button>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {reply && (
        <ReplyDialog
          open={replyDialogOpen}
          onClose={handleReplyDialogClose}
          reply={reply}
          onReplySuccess={handleReplySuccess}
        />
      )}
    </Box>
  );
};

export default Outgoing;
