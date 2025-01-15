import { Route, Routes, BrowserRouter } from 'react-router-dom';
import Register from './Pages/Register';
import VerifyEmail from './Pages/VerifyEmail';
import Login from './Pages/Login';
import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './Pages/ResetPassword';
import CodeEditor from './Pages/CodeEditor';
import NavBar from './Components/NavBar';
import NotebookApp from './Pages/Notebook';
import './App.css';

const App = () => {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<CodeEditor />} />
        <Route path="/notebook" element={<NotebookApp />} />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={<CodeEditor />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;