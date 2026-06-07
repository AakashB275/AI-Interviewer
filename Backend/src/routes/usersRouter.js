import express from 'express';
import isLoggedin from '../middlewares/isLoggedin.js';
import { registerUser, loginUser, logoutUser, getCurrentUser, updateCurrentUser, exchangeOAuthCode } from '../controllers/authController.js';
import passport from '../services/passportConfig.js';
import jwt from 'jsonwebtoken';
import { generateAuthCode } from '../utils/authCodeStore.js';

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

router.post('/exchange', exchangeOAuthCode);

router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })
);

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

        const code = generateAuthCode({
            token,
            user: {
                id: req.user._id,
                email: req.user.email,
                userName: req.user.userName
            }
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/oauth-callback?code=${code}`);
    }
);

export default router;
