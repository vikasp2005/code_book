// App.js
import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import NavBar from './Components/NavBar';
import CodeEditor from './Pages/CodeEditor';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Notebook from './Pages/Notebook';

// Create AuthContext
export const AuthContext = createContext(null);



export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedPrograms, setSavedPrograms] = useState([]);
  const navigate = useNavigate();

  const checkAuth = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/user', {
        withCredentials: true,
      });
      setUser(response.data);

      // Fetch saved programs if user is authenticated
      if (response.data) {
        const programsResponse = await axios.get('http://localhost:5000/api/managecode/list', {
          withCredentials: true,
        });
        setSavedPrograms(programsResponse.data);
      }
    } catch (error) {
      setUser(null);
      setSavedPrograms([]);
      // No session expiration logic here
    } finally {
      setLoading(false);
    }
  };





  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (userData) => {
    setUser(userData);
    await checkAuth(); // Refresh auth state and fetch programs
  };

  const logout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout', {},
        { withCredentials: true }
      );
      setUser(null);
      setSavedPrograms([]);
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

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

const AppContent = () => {
  const { user, loading, logout, savedPrograms, setSavedPrograms, checkAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate(); // Add this line

  useEffect(() => {
    checkAuth(navigate); // Pass navigate to checkAuth
  }, [checkAuth, navigate]);


  useEffect(() => {
    if (user && location.state?.showSaveDialog) {
      // Reset state and show save dialog
      navigate(location.pathname, { replace: true, state: {} });
      window.dispatchEvent(new Event('show-save-dialog'));
    }
  }, [user, location, navigate]);

  const handleLoadProgram = async (id) => {
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
  };

  const handleDeleteProgram = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/managecode/${id}`,
        { withCredentials: true }
      );
      setSavedPrograms(programs =>
        programs.filter(p => p._id !== id)
      );
    } catch (error) {
      console.error('Failed to delete program:', error);
    }
  };

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
      <Routes>
        <Route
          path="/login"
          element={<Login onLoginSuccess={checkAuth} />}
        />

        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            user ? <CodeEditor /> : <Navigate to="/login" state={{ from: '/dashboard' }} />
          }
        />
        <Route
          path="/"
          element={<CodeEditor />}
        />
        <Route path="/notebook" element={<Notebook />} />
      </Routes>
    </>
  );
};

export default App;