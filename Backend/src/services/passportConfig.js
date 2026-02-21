import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import userModel from '../models/user.js';
import { sendWelcomeEmail } from './emailService.js';

passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('No email from Google profile'), null);

      // Check if user already exists
      let user = await userModel.findOne({ email });

      if (user) {
        // Existing user — just log them in
        return done(null, user);
      }

      // New user — create account
      // Generate a username from their Google display name
      const baseUserName = profile.displayName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 20);

      // Ensure username is unique by appending random suffix if needed
      let userName = baseUserName;
      const existing = await userModel.findOne({ userName });
      if (existing) {
        userName = `${baseUserName}_${Math.floor(Math.random() * 9000) + 1000}`;
      }

      user = await userModel.create({
        email,
        userName,
        // OAuth users have no password — use a placeholder that can never be bcrypt-matched
        password: `OAUTH_GOOGLE_${profile.id}`,
        contact: 'not provided',  // matches your required field
        googleId: profile.id,
        avatar: profile.photos?.[0]?.value || null
      });

      // Send welcome email for new OAuth signups too
      sendWelcomeEmail({ to: email, userName }).catch(err =>
        console.error('OAuth welcome email error:', err.message)
      );

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await userModel.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;