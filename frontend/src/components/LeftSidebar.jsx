import { useState, useEffect } from "react";
import {
  Box,
  List,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Button,
  ListItemButton,
  Badge,
} from "@mui/material";
import {
  Inbox,
  Outbox,
  Folder,
  People,
  AccountCircle,
  ExitToApp,
  AddCircle,
} from "@mui/icons-material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios"; // Import axios for API requests
import config from "../config/config"; // Assuming you have a config file for API endpoint
import { rightLogo } from "../assets/logoBase64";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import { useUnseenRepliesSender } from "../hooks/UnseenRepliesContextSender";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userRole = localStorage.getItem("role");

  // State to hold the count of pending documents
  const [pendingCount, setPendingCount] = useState(0);
  const { unseenRepliesCountSender } = useUnseenRepliesSender();

  useEffect(() => {
    const fetchPendingCount = async () => {
      const userEmail = localStorage.getItem("email");
      try {
        const response = await axios.get(
          `${config.API}/get-documents/${userEmail}`
        );
        const documents = response.data;
        const pendingDocs = documents.filter(
          (doc) => doc.recipient_status === "Pending"
        );
        setPendingCount(pendingDocs.length);
      } catch (error) {
        console.error("Error fetching pending document count", error);
      }
    };

    fetchPendingCount();
  }, []);

  const handleLogout = () => {
    // Clear all session-related information from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <Box
      sx={{
        backgroundColor: "#0A2841",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100vh",
        padding: "15px",
        boxSizing: "border-box",
        boxShadow: "2px 0 10px rgba(0, 0, 0, 0.2)",
        transition: "all 0.3s ease",
        width: { xs: "220px", sm: "240px", md: "260px", lg: "280px" },
      }}
    >
      <Box display="flex" flexDirection="column" mb={2}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          mb={2}
        >
          <Box
            component="img"
            src={rightLogo}
            alt="Logo"
            sx={{
              width: { xs: "60px", sm: "80px", md: "100px", lg: "120px" },
              height: { xs: "60px", sm: "80px", md: "100px", lg: "120px" },
              borderRadius: "50%",
              objectFit: "cover",
              padding: "1px",
              transition: "transform 0.3s ease",
              "&:hover": { transform: "scale(1.1)" },
            }}
          />
          <Typography
            variant="subtitle1"
            sx={{ fontSize: "18px", color: "#fff", fontWeight: "bold" }}
          >
            AABn Web ({userRole})
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddCircle />}
          component={Link}
          to="/compose"
          sx={{
            marginBottom: "5px",
            backgroundColor: "#FFA000",
            fontSize: { xs: "9px", sm: "10px", md: "12px" },
            padding: { xs: "5px 12px", sm: "6px", md: "8px 10px" },
            borderRadius: "8px",
            "&:hover": { backgroundColor: "#FFB233" },
          }}
        >
          Compose
        </Button>

        <List
          component="nav"
          sx={{
            maxHeight: "calc(100vh - 300px)",
          }}
        >
          <Typography
            sx={{
              marginTop: "8px",
              marginBottom: "4px",
              fontSize: { xs: "10px", sm: "12px", md: "14px" },
              color: "#FFA000",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            User
          </Typography>
          {[
            {
              text: "Incoming",
              icon: <Inbox />,
              path: "/incoming",
              badge: pendingCount,
            },
            {
              text: "Outgoing",
              icon: <Outbox />,
              path: "/outgoing",
              badge: unseenRepliesCountSender,
            },
            {
              text: "Archive Folders",
              icon: <Folder />,
              path: "/archive",
            },
            {
              text: "Accounts",
              icon: <AccountCircle />,
              path: "/accounts",
            },
            {
              text: "Document Tracking",
              icon: <TrackChangesIcon />,
              path: "/document-tracking",
            },
          ].map((item, index) => (
            <ListItemButton
              key={index}
              component={Link}
              to={item.path}
              className={location.pathname === item.path ? "active" : ""}
              sx={{
                backgroundColor: "transparent",
                padding: { xs: "2px", sm: "4px", md: "5px" },
                "&:hover": { backgroundColor: "#1c3b5a" },
                borderRadius: "8px",
                marginBottom: "4px",
                transition: "all 0.2s ease",
                "&.active": {
                  backgroundColor: "#FFA000",
                  "&:hover": { backgroundColor: "#FFB233" },
                  "& .MuiListItemText-root": { color: "#000" },
                  "& .MuiListItemIcon-root": { color: "#000" },
                },
              }}
            >
              <ListItemIcon
                sx={{ color: "white", minWidth: "30px", fontSize: "20px" }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  fontSize: { xs: "5px", sm: "6px", md: "7px" },
                  display: { xs: "none", sm: "block" },
                }}
              />
              {item.badge > 0 && (
                <Badge badgeContent={item.badge} color="error" sx={{ ml: 1 }} />
              )}
            </ListItemButton>
          ))}

          {userRole === "S6" && (
            <>
              <Typography
                sx={{
                  marginTop: "4px",
                  marginBottom: "2px",
                  fontSize: { xs: "10px", sm: "12px", md: "14px" },
                  color: "#FFA000",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                Admin
              </Typography>
              <ListItemButton
                component={Link}
                to="/users"
                className={location.pathname === "/users" ? "active" : ""}
                sx={{
                  backgroundColor: "transparent",
                  padding: { xs: "2px", sm: "4px", md: "5px" },
                  "&:hover": { backgroundColor: "#1c3b5a" },
                  borderRadius: "8px",
                  marginBottom: "4px",
                  transition: "all 0.2s ease",
                  "&.active": {
                    backgroundColor: "#FFA000",
                    "&:hover": { backgroundColor: "#FFB233" },
                    "& .MuiListItemText-root": { color: "#000" },
                    "& .MuiListItemIcon-root": { color: "#000" },
                  },
                }}
              >
                <ListItemIcon
                  sx={{ color: "white", minWidth: "30px", fontSize: "20px" }}
                >
                  <People />
                </ListItemIcon>
                <ListItemText
                  primary="User Management"
                  sx={{
                    fontSize: { xs: "10px", sm: "12px", md: "14px" },
                    display: { xs: "none", sm: "block" }, // Show text only on larger screens
                  }}
                />
              </ListItemButton>
            </>
          )}
        </List>
      </Box>

      <Box>
        <Divider
          sx={{
            marginBottom: "16px",
            backgroundColor: "#FFA000",
          }}
        />
        <Button
          onClick={handleLogout}
          startIcon={<ExitToApp />}
          sx={{
            backgroundColor: "#ff3b3b",
            color: "#fff",
            padding: { xs: "5px 10px", sm: "6px", md: "8px 12px" },
            fontSize: { xs: "9px", sm: "10px", md: "12px" },
            fontWeight: "bold",
            borderRadius: "8px",
            width: "100%",
            "&:hover": { backgroundColor: "#ff5555" },
          }}
        >
          Log Out
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;
