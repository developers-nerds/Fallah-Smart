const jwt = require('jsonwebtoken');
const { Users } = require('../database/assossiation');

const JWT_SECRET = process.env.JWT_SECRET || '1234';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '12344';
const JWT_EXPIRES_IN = '1h';

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // Find user with valid refresh token
    const user = await Users.findOne({
      where: {
        id: decoded.id,
        refreshToken
      }
    });

    if (!user) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ message: 'Invalid refresh token' });
  }
};

module.exports = refreshToken; 