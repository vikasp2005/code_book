import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import NavBar from './Components/NavBar';
import CodeEditor from './Pages/CodeEditor';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Notebook from './Pages/Notebook';
import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './Pages/ResetPassword';
import VerifyEmail from './Pages/VerifyEmail';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/user', {
        withCredentials: true,
      });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]); // Added checkAuth to dependency array

  const login = async (userData) => {
    setUser(userData);
    await checkAuth();
  };

  const logout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout', {},
        { withCredentials: true }
      );
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const AppContent = () => {
  const { user, loading, logout, checkAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // Add showSidebar state
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (user && location.state?.showSaveDialog) {
      navigate(location.pathname, { replace: true, state: {} });
      window.dispatchEvent(new Event('show-save-dialog'));
    }
  }, [user, location, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <NavBar
        isAuthenticated={!!user}
        user={user}
        onLogout={logout}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        showSidebar={showSidebar}
      />

      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={checkAuth} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/dashboard"
          element={
            user ? (
              <CodeEditor
                showSidebar={showSidebar} // Pass showSidebar to CodeEditor
              />
            ) : (
              <Navigate to="/login" state={{ from: '/dashboard' }} />
            )
          }
        />
        <Route path="/" element={
          <CodeEditor
            showSidebar={showSidebar} // Pass showSidebar to CodeEditor
          />
        } />
        <Route path="/notebook" element={<Notebook showSidebar={showSidebar} />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;