import {User} from '../Models/User.Model.js';

export const Login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      if (!user.verified) {
        return res.status(400).json({ message: 'Please verify your email first' });
      }
  
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      req.session.userId = user._id;
      res.json({ message: 'Login successful' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
};