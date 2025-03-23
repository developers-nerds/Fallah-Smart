import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './redux/store';
import LoginForm from './components/LoginForm';
import Dashboard from './pages/Dashboard';
import StockDashboard from './pages/StockDashboard';
import PrivateRoute from './components/PrivateRoute';
import Profile from './pages/Profile';
import ProtectedLayout from './components/ProtectedLayout';
import Marketplace from "./pages/Marketplace"
import AiChat from "./pages/AiChat"
import Wallet from "./pages/Wallet"
import Education from "./pages/Education"
import Blogs from "./pages/Blogs"

function App() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginForm />} />
      
      {/* Protected routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/stock" element={<StockDashboard />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/ai-chat" element={<AiChat />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/education" element={<Education />} />
          <Route path="/blogs" element={<Blogs />} />
        </Route>
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;

