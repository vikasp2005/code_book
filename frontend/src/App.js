import { Route, Routes, BrowserRouter } from 'react-router-dom';
import Register from './Components/Register';
import VerifyEmail from './Components/VerifyEmail';
import Login from './Components/Login';
import './App.css';

const App = () => {
  return (
    <BrowserRouter>

      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<VerifyEmail />} />
      </Routes>

    </BrowserRouter>
  );
};
export default App;
