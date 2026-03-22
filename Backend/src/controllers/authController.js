import userModel from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { sendWelcomeEmail } from '../services/emailService.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_KEY || process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or JWT_KEY environment variable must be set');
}

// Cross-domain cookie config.
// The frontend ALSO stores the token in localStorage as a fallback and sends
// it via the Authorization header (isLoggedin.js reads both).
function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,                      // HTTPS only in production
    sameSite: isProd ? 'none' : 'lax',  // cross-domain in prod, relaxed in dev
    maxAge: 7 * 24 * 60 * 60 * 1000    // 7 days
  };
}

export const registerUser = async function (req, res) {
  try {
    const { email, userName, password, contact } = req.body;

    if (!email || !userName || !password || !contact) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    }

    const userExist = await userModel.findOne({ email });
    if (userExist) return res.status(401).json({ success: false, error: 'You already have an account. Please login.' });

    const userNameExist = await userModel.findOne({ userName });
    if (userNameExist) {
      return res.status(409).json({ success: false, error: 'Username already taken. Please choose another.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({ email, userName, password: hashedPassword, contact });

    sendWelcomeEmail({ to: user.email, userName: user.userName }).catch(err =>
      console.error('Background email error:', err.message)
    );

    const token = generateToken(user);
    res.cookie('token', token, cookieOptions());

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, email: user.email, userName: user.userName, contact: user.contact }
    });
  } catch (err) {
    console.error('Error in register:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

export const loginUser = async function (req, res) {
  try {
    const { userName, password } = req.body;

    if (!userName || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const user = await userModel.findOne({ userName });
    if (!user) return res.status(401).json({ error: 'Username or Password incorrect' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Username or Password incorrect' });

    const token = generateToken(user);
    res.cookie('token', token, cookieOptions());

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, userName: user.userName, contact: user.contact }
    });
  } catch (err) {
    console.error('Error in login:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

export const logoutUser = async function (req, res) {
  try {
    res.clearCookie('token', cookieOptions());
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    console.error('Error in logout:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getCurrentUser = async function (req, res) {
  try {
    return res.status(200).json({ success: true, user: req.user });
  } catch (err) {
    console.error('Error getting current user:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateCurrentUser = async function (req, res) {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { userName, contact } = req.body;
    if (!userName && !contact) {
      return res.status(400).json({ success: false, error: 'No updatable fields provided' });
    }

    if (userName) {
      const existing = await userModel.findOne({ userName });
      if (existing && existing._id.toString() !== userId.toString()) {
        return res.status(409).json({ success: false, error: 'Username already taken' });
      }
    }

    const updates = {};
    if (userName) updates.userName = userName;
    if (contact) updates.contact = contact;

    const updated = await userModel.findByIdAndUpdate(userId, { $set: updates }, { new: true }).select('-password');
    return res.status(200).json({ success: true, user: updated });
  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

function generateToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}