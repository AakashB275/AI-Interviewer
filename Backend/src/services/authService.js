import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from "dotenv";
import { UserSchema} from '../models/user';
dotenv.config();

//checks if JWT_KEY exists or not and then stores it in variable as string
if (!process.env.JWT_KEY) {
  throw new Error("JWT_KEY is missing. Set it in your .env file.");
}

const JWT_KEY = process.env.JWT_KEY;


export async function signupUser(email, name, password) {
  const existing = await UserSchema.findOne({ email: email.toLowerCase() });
  if (existing) throw new Error('User already exists');

  const hashed = await bcrypt.hash(password, 10);

  const user = await UserSchema.create({ email: email.toLowerCase(), name, password: hashed });
  const token = generateToken(user);
  return { user: sanitize(user), token };
}

export async function signinUser(email, password) {
  const user = await UserSchema.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error('Invalid credentials');

  const ok = await bcrypt.compare(password, (user).password);
  if (!ok) throw new Error('Invalid credentials');

  const token = generateToken(user);
  return { user: sanitize(user), token };
}

function generateToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function sanitize(user) {
  const u = user.toObject ? user.toObject() : { ...user };
  delete u.password;
  return u;
}

export default { signupUser, signinUser };