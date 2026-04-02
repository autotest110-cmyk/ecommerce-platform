const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    console.log('[AUTH] Authorization header:', req.header('Authorization'));
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      console.log('[AUTH] No token found');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('[AUTH] Token decoded:', decoded);
    req.user = decoded.user || { id: decoded.id }; // fallback for older JWT format

    next();
  } catch (err) {
    console.error('[AUTH] Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;