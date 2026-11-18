import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { isMemoryMode, memoryStore } from '../config/db.js';
import { User } from '../models/User.js';

function generateToken(id, role) {
  return jwt.sign({ id, role }, config.jwtSecret, { expiresIn: '7d' });
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    let user = null;
    const isLiveMongo = mongoose.connection && mongoose.connection.readyState === 1 && !isMemoryMode;
    if (isLiveMongo) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else {
      user = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch && user.password !== password) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const userId = user._id || user.id;
    const token = generateToken(userId, user.role);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        employeeId: user.employeeId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'An error occurred during authentication. Please try again.' });
  }
}

export async function register(req, res) {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required fields.' });
    }

    let existing = null;
    if (!isMemoryMode) {
      existing = await User.findOne({ email: email.toLowerCase() });
    } else {
      existing = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    }

    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'Employee',
      department: department || 'General',
      avatar: `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150`,
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`
    };

    if (!isMemoryMode) {
      const created = await User.create(newUser);
      const token = generateToken(created._id, created.role);
      return res.status(201).json({
        message: 'Account created successfully',
        token,
        user: {
          id: created._id,
          name: created.name,
          email: created.email,
          role: created.role,
          department: created.department,
          avatar: created.avatar,
          employeeId: created.employeeId
        }
      });
    } else {
      newUser.id = String(Date.now());
      newUser._id = newUser.id;
      memoryStore.users.push(newUser);
      const token = generateToken(newUser.id, newUser.role);
      return res.status(201).json({
        message: 'Account created successfully',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
          avatar: newUser.avatar,
          employeeId: newUser.employeeId
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to create user account.' });
  }
}

export async function me(req, res) {
  return res.json({
    user: {
      id: req.user._id || req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
      avatar: req.user.avatar,
      employeeId: req.user.employeeId
    }
  });
}
