import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./lib/auth";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import VisitsList from "./pages/VisitsList";
import VisitDetail from "./pages/VisitDetail";
import AdminUsers from "./pages/AdminUsers";
import HistoryPage from "./pages/History";
import GlobalDashboard from "./pages/GlobalDashboard";
import VisitMatrix from "./pages/VisitMatrix";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><VisitsList /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><GlobalDashboard /></ProtectedRoute>} />
            <Route path="/matrix" element={<ProtectedRoute><VisitMatrix /></ProtectedRoute>} />
            <Route path="/visits/:id" element={<ProtectedRoute><VisitDetail /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
