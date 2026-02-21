import express from 'express';
import isLoggedin from '../middlewares/isLoggedin.js';
import { registerUser, loginUser, logoutUser, getCurrentUser, updateCurrentUser } from '../controllers/authController.js';
import passport from '../services/passportConfig.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_KEY || process.env.JWT_SECRET;

const router = express.Router();

router.get('/me', isLoggedin, getCurrentUser);
router.put('/me', isLoggedin, updateCurrentUser);
router.post('/logout', logoutUser);
router.get('/', (req, res) => {
    res.send('hey');
});

router.post('/register', registerUser );
router.post('/login', loginUser );

// ── Google OAuth routes ──────────────────────────────────────────

// Step 1: Redirect user to Google's login page
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })
);

// Step 2: Google redirects back here after user approves
router.get('/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?error=oauth_failed`,
        session: false
    }),
    (req, res) => {
        const token = jwt.sign(
            { id: req.user._id, email: req.user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/oauth-callback?token=${token}&userName=${encodeURIComponent(req.user.userName)}&userId=${req.user._id}`);
    }
);

export default router;
