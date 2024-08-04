const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = (requiredRole) => {
  return async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: 'Invalid token.' });
      }

      if (requiredRole && !user.roles.includes(requiredRole)) {
        return res.status(403).json({ message: 'Access forbidden: insufficient permissions.' });
      }

      req.user = user;
      next();
    } catch (err) {
      res.status(401).json({ message: 'Token is not valid.' });
    }
  };
};

module.exports = authMiddleware;
