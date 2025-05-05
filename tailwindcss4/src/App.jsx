import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import RegisterPage from './pages/RegisterPage';
import CreateAuction from './pages/CreateAuction';

function App() {
  const role = localStorage.getItem("role");

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/create-auction" element={<CreateAuction />} />

        {/* Conditional routes based on user role */}
        <Route path="/buyer" element={role === "buyer" ? <BuyerDashboard /> : <Navigate to="/" />} />
        <Route path="/seller" element={role === "seller" ? <SellerDashboard /> : <Navigate to="/" />} />
        {/* Optional: Admin Dashboard */}
        {/* <Route path="/admin" element={role === "admin" ? <AdminDashboard /> : <Navigate to="/" />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
