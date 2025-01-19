import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles = [], redirectPath = "/", fallback = null }) => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role"); // Get the user's role from localStorage

    if (!token) {
        // If no token is found, show fallback UI or redirect to the login page
        return fallback || <Navigate to={redirectPath} replace />;
    }

    // Check if the user's role is allowed to access the route
    if (!allowedRoles.includes(userRole)) {
        // If the role is not allowed, redirect to a not authorized page or the default redirect path
        return <Navigate to="/not-authorized" replace />;
    }

    // If a token is found and the role is allowed, allow access to the route
    return children;
};

// Prop types validation
ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired, // The component(s) to render if access is allowed
    allowedRoles: PropTypes.arrayOf(PropTypes.string), // Roles allowed to access the route
    redirectPath: PropTypes.string, // Path to redirect if not authenticated
    fallback: PropTypes.node, // UI to display while checking or if unauthorized
};

export default ProtectedRoute;
