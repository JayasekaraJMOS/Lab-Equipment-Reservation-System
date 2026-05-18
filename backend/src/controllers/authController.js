const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../middleware/auth');

function userPayload(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department
  };
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(400).json({ error: 'User email already exists.' });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role: 'student',
      department: department || 'Electrical & Electronic Engineering'
    });
    const payload = userPayload(user);
    const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });

    return res.status(201).json({ message: 'User registered successfully', token, user: payload });
  } catch (err) {
    console.error('[Auth Registration Error]', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'User email already exists.' });
    }
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+password');
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const payload = userPayload(user);
    const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
    return res.json({ message: 'Login successful', token, user: payload });
  } catch (err) {
    console.error('[Auth Login Error]', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email role department created_at').lean();
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    return res.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('[Auth Profile Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
};
