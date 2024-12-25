import {User} from '../Models/User.Model.js';
export const Verify_Email=  async (req, res) => {
    try {
      const user = await User.findOne({ verificationToken: req.params.token });
      if (!user) {
        return res.status(400).json({ message: 'Invalid verification token' });
      }
  
      user.verified = true;
      user.verificationToken = undefined;
      await user.save();
  
      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  };