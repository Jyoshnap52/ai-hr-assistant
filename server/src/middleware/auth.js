import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { isMemoryMode, memoryStore } from '../config/db.js';
import { User } from '../models/User.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    let user = null;
    if (!isMemoryMode) {
      user = await User.findById(decoded.id).select('-password');
    } else {
      user = memoryStore.users.find((u) => String(u._id || u.id) === String(decoded.id));
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Session expired or invalid token.' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'HR Admin') {
    return res.status(403).json({ error: 'Access denied. HR Admin privileges required for this action.' });
  }
  next();
};
