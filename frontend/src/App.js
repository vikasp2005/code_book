import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import NavBar from './Components/NavBar';
import CodeEditor from './Pages/CodeEditor';
import Login from './Pages/Login';
import Register from './Pages/Register';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await axios.get('http://localhost:5000/api/auth/user',
          { withCredentials: true }
        );
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [savedPrograms, setSavedPrograms] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/user',
          { withCredentials: true }
        );
        setUser(response.data);
        // Fetch saved programs only if user is authenticated
        if (response.data) {
          const programsResponse = await axios.get('http://localhost:5000/api/managecode/list',
            { withCredentials: true }
          );
          setSavedPrograms(programsResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleLoadProgram = async (id) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/managecode/${id}`,
        { withCredentials: true }
      );
      // You'll need to implement this method in your CodeEditor component
      // to update the editor's content
      window.dispatchEvent(new CustomEvent('load-program', {
        detail: response.data
      }));
    } catch (error) {
      console.error('Failed to load program:', error);
    }
  };

  return (
    <BrowserRouter>
      <NavBar
        isAuthenticated={!!user}
        user={user}
        savedPrograms={savedPrograms}
        onLoadProgram={handleLoadProgram}
        onDeleteProgram={async (id) => {
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
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <CodeEditor isAuthenticated={!!user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={<CodeEditor isAuthenticated={!!user} />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;