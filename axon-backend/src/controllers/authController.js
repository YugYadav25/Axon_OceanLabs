const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

exports.login = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    // Find or create user
    let user = await User.findOne({ githubId: username }); // using username as ID for simplicity
    if (!user) {
      user = await User.create({
        githubId: username,
        username: username,
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.githubId, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
