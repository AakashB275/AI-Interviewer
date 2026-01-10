import express from 'express';
import isLoggedin from '../middlewares/isLoggedin.js';
import { registerUser, loginUser, logoutUser, getCurrentUser } from '../controllers/authController.js';

const router = express.Router();

router.get('/me', isLoggedin, getCurrentUser);
router.post('/logout', logoutUser);
router.get('/', (req, res) => {
    res.send('hey');
});

router.post('/register', registerUser );
router.post('/login', loginUser );

export default router;
