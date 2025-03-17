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
import Alert from './Components/Alert'; // Import the Alert component
import Loader from './Components/Loader';
import { GenerateUUID } from './Components/GenerateUUID'; // Import the generateUUID utility

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [alerts, setAlerts] = useState([]); // Centralized alert system
  const [isLoading, setIsLoading] = useState(false); // Centralized loader
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/auth/user', {
        withCredentials: true,
      });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (userData) => {
    setUser(userData);
    await checkAuth();
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    finally {
      setIsLoading(false);
    }
  };

  const showAlert = (type, message) => {
    const id = GenerateUUID();
    setAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 3000);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      alerts,
      login,
      logout,
      checkAuth,
      showAlert,
      setAlerts,  // Pass isLoading to all components
      setIsLoading, // Pass setIsLoading to all components
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const AppContent = () => {
  const { user, isLoading, logout, checkAuth, alerts, setAlerts } = useAuth(); // Destructure alerts
  const location = useLocation();
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (user && location.state?.showSaveDialog) {
      navigate(location.pathname, { replace: true, state: {} });
      window.dispatchEvent(new Event('show-save-dialog'));
    }
  }, [user, location, navigate]);



  return (
    <>
      {/* Centralized Alert System */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {alerts.map(alert => (
          <Alert
            key={alert.id}
            message={alert.message}
            type={alert.type}
            onClose={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
          />
        ))}
      </div>

      {/* Centralized Loader */}
      {isLoading && (
        <Loader fullScreen={true} />
      )}

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
        <Route path="/verify-otp" element={<VerifyEmail />} />
        <Route
          path="/dashboard"
          element={
            user ? (
              <CodeEditor
                showSidebar={showSidebar}
              />
            ) : (
              <Navigate to="/login" state={{ from: '/dashboard' }} />
            )
          }
        />
        <Route path="/" element={
          <CodeEditor
            showSidebar={showSidebar}
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