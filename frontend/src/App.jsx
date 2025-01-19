import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Incoming from "./pages/user/Incoming/Incoming";
import Outgoing from "./pages/user/Outgoing/Outgoing";
import Archive from "./pages/user/Archive/Archive";
import UserManagement from "./pages/admin/UserManagement/UserManagement";
import Accounts from "./pages/user/Accounts/Accounts";
import Compose from "./pages/user/Compose/Compose";
import Login from "./pages/Login/LoginPage";
import ProtectedRoute from "./config/ProtectedRoute";
import { useState } from "react";
import { UnseenRepliesProviderReceiver } from "./hooks/UnseenRepliesContextReceiver";
import { UnseenRepliesProviderSender } from "./hooks/UnseenRepliesContextSender";
import DocumentTracking from "./pages/user/Tracking/DocumentTracking";

function App() {
  const [unseenCount, setUnseenCount] = useState(0);

  return (
    <UnseenRepliesProviderReceiver>
      <UnseenRepliesProviderSender>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              element={
                <ProtectedRoute allowedRoles={["S1", "S2", "S3", "S4", "S6"]}>
                  <Layout
                    unseenCount={unseenCount}
                    setUnseenCount={setUnseenCount}
                  />
                </ProtectedRoute>
              }
            >
              <Route path="/incoming" element={<Incoming />} />
              <Route path="/outgoing" element={<Outgoing />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/compose" element={<Compose />} />
              <Route path="/document-tracking" element={<DocumentTracking />} />
            </Route>
            <Route
              element={
                <ProtectedRoute allowedRoles={["S6"]}>
                  <Layout
                    unseenCount={unseenCount}
                    setUnseenCount={setUnseenCount}
                  />
                </ProtectedRoute>
              }
            >
              <Route path="/users" element={<UserManagement />} />
            </Route>
            <Route path="/not-authorized" element={<div>Not Authorized</div>} />
          </Routes>
        </Router>
      </UnseenRepliesProviderSender>
    </UnseenRepliesProviderReceiver>
  );
}

export default App;
