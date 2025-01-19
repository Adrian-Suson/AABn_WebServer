import { useState, useEffect } from "react"; // Import useEffect for localStorage persistence
import { Box } from "@mui/material";
import RightSidebar from "./RightSidebar"; // Import RightSidebar component
import PropTypes from "prop-types";
import { Outlet } from "react-router-dom";
import Sidebar from "./LeftSidebar";

const Layout = ({ unseenCount, setUnseenCount }) => {
  // Check localStorage for sidebar state and set initial state accordingly
  const [isExpanded, setIsExpanded] = useState(() => {
    // Retrieve the saved state from localStorage (or default to false)
    const savedState = localStorage.getItem("sidebarExpanded");
    return savedState === "true"; // Convert string to boolean
  });

  // Function to toggle sidebar
  const toggleSidebar = () => {
    setIsExpanded((prevState) => {
      const newState = !prevState;
      // Save the new state to localStorage
      localStorage.setItem("sidebarExpanded", newState.toString());
      return newState;
    });
  };

  useEffect(() => {
    // On first render, sync the state with the stored value in localStorage
    const savedState = localStorage.getItem("sidebarExpanded");
    if (savedState) {
      setIsExpanded(savedState === "true");
    }
  }, []);

  return (
    <Box display="flex">
      {/* Left Sidebar */}
      <Sidebar unseenCount={unseenCount} setUnseenCount={setUnseenCount} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflowX: "auto",
          padding: "16px",
          marginRight: isExpanded ? "333px" : "60px", // Adjust margin based on sidebar state
          transition: "margin-right 0.3s ease", // Smooth transition
        }}
      >
        <Outlet />
      </Box>

      {/* Right Sidebar */}
      <RightSidebar isExpanded={isExpanded} toggleSidebar={toggleSidebar} />
    </Box>
  );
};

Layout.propTypes = {
  unseenCount: PropTypes.number.isRequired,
  setUnseenCount: PropTypes.func.isRequired,
};

export default Layout;
