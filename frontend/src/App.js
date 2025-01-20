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
import DeleteConfirmationDialog from './Components/DeleteConfirmationDialog';

// Create AuthContext
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedPrograms, setSavedPrograms] = useState([]);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/user', {
        withCredentials: true,
      });
      setUser(response.data);

      if (response.data && (!savedPrograms.length || savedPrograms.length === 0)) {
        const programsResponse = await axios.get('http://localhost:5000/api/managecode/list', {
          withCredentials: true,
        });
        setSavedPrograms(programsResponse.data);
      }
    } catch (error) {
      setUser(null);
      setSavedPrograms([]);
    } finally {
      setLoading(false);
    }
  }, [savedPrograms.length]);

  useEffect(() => {
    checkAuth();
  }, []);

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
      setSavedPrograms([]);
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
      savedPrograms,
      setSavedPrograms,
      checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

const AppContent = () => {
  const { user, loading, logout, savedPrograms, setSavedPrograms, checkAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // State for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);

  const handleLoadProgram = useCallback(async (id) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/managecode/${id}`,
        { withCredentials: true }
      );
      window.dispatchEvent(new CustomEvent('load-program', {
        detail: response.data
      }));
    } catch (error) {
      console.error('Failed to load program:', error);
    }
  }, []);

  const handleDeleteProgram = useCallback(async (id) => {
    const program = savedPrograms.find(p => p._id === id);
    if (program) {
      setProgramToDelete(program);
      setDeleteDialogOpen(true);
    }
  }, [savedPrograms]);

  const confirmDelete = async () => {
    if (programToDelete) {
      try {
        await axios.delete(`http://localhost:5000/api/managecode/${programToDelete._id}`,
          { withCredentials: true }
        );
        setSavedPrograms(programs =>
          programs.filter(p => p._id !== programToDelete._id)
        );
        setDeleteDialogOpen(false);
        setProgramToDelete(null);
      } catch (error) {
        console.error('Failed to delete program:', error);
      }
    }
  };

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
        savedPrograms={savedPrograms}
        onLoadProgram={handleLoadProgram}
        onLogout={logout}
        onDeleteProgram={handleDeleteProgram}
      />

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setProgramToDelete(null);
        }}
        onConfirm={confirmDelete}
        fileName={programToDelete?.fileName || ''}
      />

      <Routes>
        {/* Authentication Routes */}
        <Route path="/login" element={<Login onLoginSuccess={checkAuth} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            user ? <CodeEditor fetchUserFiles={checkAuth} /> : <Navigate to="/login" state={{ from: '/dashboard' }} />
          }
        />

        {/* Public Routes */}
        <Route path="/" element={<CodeEditor />} />
        <Route path="/notebook" element={<Notebook />} />
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