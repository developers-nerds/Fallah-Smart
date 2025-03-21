import { Route, Routes, Navigate } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ProtectedLayout from './components/ProtectedLayout';
import Stock from "./pages/Stock"
import Marketplace from "./pages/Marketplace"
import AiChat from "./pages/AiChat"
import Wallet from "./pages/Wallet"
import Education from "./pages/Education"
import Blogs from "./pages/Blogs"
import Categories from './pages/Categories'
import { useAppSelector } from './redux/store';

function App() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginForm />
      } />

      {/* Protected routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/ai-chat" element={<AiChat />} />
          <Route path="/categories" element={<Categories />} />
        <Route path="/wallet" element={<Wallet />} />
          <Route path="/education" element={<Education />} />
          <Route path="/blogs" element={<Blogs />} />
        </Route>
      </Route>
      
      {/* Catch all - redirect to dashboard if authenticated, login otherwise */}
      <Route path="*" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />
      } />
    </Routes>
  );
}

export default App;

