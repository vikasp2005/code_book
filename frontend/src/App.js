import { Route, Routes, BrowserRouter } from 'react-router-dom';
import Register from './Components/Register';
import VerifyEmail from './Components/VerifyEmail';
import Login from './Components/Login';
import ForgotPassword from './Components/ForgotPassword';
import ResetPassword from './Components/ResetPassword';
import CodeEditor from './Components/CodeEditor';
import { Toaster } from './Components/ui/toaster'; // Add this import
import './App.css';

const App = () => {
  return (
    <BrowserRouter>
      <Toaster /> {/* Add the Toaster component here, outside of Routes */}
      <Routes>
        <Route path="/" element={<Login />} />
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