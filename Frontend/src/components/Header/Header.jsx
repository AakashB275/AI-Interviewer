import React, { useState, useEffect } from "react";
import ThemeToggle from "../ui/theme-toggle";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../ui/card.jsx"; 

function Header() {
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const [isLoginCardOpen, setIsLoginCardOpen] = useState(false);
  const [isSignUpCardOpen ,setIsSignUpCardOpen] = useState(false)
  const [loginForm, setLoginForm] = useState({ userName: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ userName: '', email: '', contact: '', password: '' });
  const { isLoggedIn, login, logout } = useAuth();
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  async function parseResponseSafe(res) {
    const txt = await res.text();
    try { return txt ? JSON.parse(txt) : {}; } catch { return { text: txt }; }
  }

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleLogout = () => {
    // call backend logout and clear local state
    fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' }).finally(() => {
      logout();
    });
  };

  return (
    <>
      <header className="w-full mt-0 px-6 py-4 flex items-center border-b border-white/10 text-white bg-transparent">
        {/* Logo */}
        <div className="flex-shrink-0 text-blue-400 font-bold text-lg">
          <a href="/home">TrainMeAI</a>
        </div>

        <nav className="flex-1 flex justify-center gap-12">
          <NavLink
            to="/pricing"
            className={({ isActive }) =>
              `transition-colors duration-200 ${
                isActive ? "text-blue-400" : "text-black"
              } hover:text-blue-400`
            }
          >
            Pricing
          </NavLink>
          <NavLink
            to="/reviews"
            className={({ isActive }) =>
              `transition-colors duration-200 ${
                isActive ? "text-blue-400" : "text-black"
              } hover:text-blue-400`
            }
          >
            Reviews
          </NavLink>
          {isLoggedIn && (
          <NavLink
            to="/user/userid"
            className={({ isActive }) =>
              `transition-colors duration-200 ${
                isActive ? "text-blue-400" : "text-black"
              } hover:text-blue-400`
            }
          >
            Profile
          </NavLink>
          )}
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `transition-colors duration-200 ${
                isActive ? "text-blue-400" : "text-black"
              } hover:text-blue-400`
            }
          >
            Contact Us
          </NavLink>
        </nav>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* <ThemeToggle /> */}
          {isLoggedIn ? (
            <button
              className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
              onClick={handleLogout}
            >
              Logout
            </button>
          ) : (
            <>
              <button
                className="px-4 py-1 border bg-blue-500 text-white rounded hover:bg-blue-500/20 transition"
                onClick={() => setIsLoginCardOpen(true)}
              >
                Login
              </button>
              <button className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                onClick={() => setIsSignUpCardOpen(true)}>
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      
      {isLoginCardOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 bg-slate-800/95 backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Login</CardTitle>
              <CardDescription className="text-gray-300">Enter your credentials to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                value={loginForm.userName}
                onChange={e => setLoginForm({...loginForm, userName: e.target.value})}
                type="text"
                placeholder="Username"
                className="w-full border border-white/20 bg-slate-700/50 text-white placeholder-gray-400 px-3 py-2 rounded mb-3 focus:border-blue-400 focus:outline-none"
              />
              <input
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                type="password"
                placeholder="Password"
                className="w-full border border-white/20 bg-slate-700/50 text-white placeholder-gray-400 px-3 py-2 rounded focus:border-blue-400 focus:outline-none"
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <button
                className="px-4 py-1 rounded bg-slate-600 text-white hover:bg-slate-500 transition"
                onClick={() => setIsLoginCardOpen(false)}
              >
                Cancel
              </button>
              <button className="px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition" onClick={async () => {
                try {
                  const res = await fetch(`${API_BASE}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ userName: loginForm.userName, password: loginForm.password })
                  });
                  const data = await parseResponseSafe(res);
                  if (!res.ok) throw new Error(data.error || data.message || 'Login failed');
                  if (data.token) {
                    login(data.token, data.user);
                  }
                  setIsLoginCardOpen(false);
                  setLoginForm({ userName: '', password: '' });
                } catch (err) {
                  alert(String(err));
                }
              }}>
                Login
              </button>
            </CardFooter>
          </Card>
        </div>
      )}
      {isSignUpCardOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 bg-slate-800/95 backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Register</CardTitle>
              <CardDescription className="text-gray-300">Create your account to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                value={registerForm.userName}
                onChange={e => setRegisterForm({...registerForm, userName: e.target.value})}
                type="text"
                placeholder="Set Username"
                className="w-full border border-white/20 bg-slate-700/50 text-white placeholder-gray-400 px-3 py-2 rounded mb-3 focus:border-blue-400 focus:outline-none"
              />

              <input
                value={registerForm.email}
                onChange={e => setRegisterForm({...registerForm, email: e.target.value})}
                type="email"
                placeholder="Email"
                className="w-full border border-white/20 bg-slate-700/50 text-white placeholder-gray-400 px-3 py-2 rounded mb-3 focus:border-blue-400 focus:outline-none"
              />
              <input
                value={registerForm.contact}
                onChange={e => setRegisterForm({...registerForm, contact: e.target.value})}
                type="text"
                placeholder="Phone no."
                className="w-full border border-white/20 bg-slate-700/50 text-white placeholder-gray-400 px-3 py-2 rounded mb-3 focus:border-blue-400 focus:outline-none"
              />
              <input
                value={registerForm.password}
                onChange={e => setRegisterForm({...registerForm, password: e.target.value})}
                type="password"
                placeholder="Set Password"
                className="w-full border border-white/20 bg-slate-700/50 text-white placeholder-gray-400 px-3 py-2 rounded focus:border-blue-400 focus:outline-none"
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <button
                className="px-4 py-1 rounded bg-slate-600 text-white hover:bg-slate-500 transition"
                onClick={() => setIsSignUpCardOpen(false)}
              >
                Cancel
              </button>
              <button className="px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition" onClick={async () => {
                try {
                  const res = await fetch(`${API_BASE}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ userName: registerForm.userName, email: registerForm.email, contact: registerForm.contact, password: registerForm.password })
                  });
                  const data = await parseResponseSafe(res);
                  if (!res.ok) throw new Error(data.error || data.message || 'Registration failed');
                  if (data.token) {
                    login(data.token, data.user);
                  }
                  setIsSignUpCardOpen(false);
                  setRegisterForm({ userName: '', email: '', contact: '', password: '' });
                } catch (err) {
                  alert(String(err));
                }
              }}>
                SignUp
              </button>
            </CardFooter>
          </Card>
        </div>
      )
      }
    </>
  );
}

export default Header;