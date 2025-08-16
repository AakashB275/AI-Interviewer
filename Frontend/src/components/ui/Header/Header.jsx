import React, { useState, useEffect } from "react";
import ThemeToggle from "../theme-toggle";
import { NavLink } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../card.jsx"; 

function Header() {
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const [isLoginCardOpen, setIsLoginCardOpen] = useState(false);
  const [isSignUpCardOpen ,setIsSignUpCardOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <>
      <header className="w-full mt-0 px-6 py-4 flex items-center border-b border-white/10 text-white bg-transparent">
        {/* Logo */}
        <div className="flex-shrink-0 text-blue-400 font-bold text-lg">
          <a href="/home/userid">TrainMeAI</a>
        </div>

        <nav className="flex-1 flex justify-center gap-12">
          <NavLink
            to="/pricing"
            className={({ isActive }) =>
              `transition-colors duration-200 ${
                isActive ? "text-blue-400" : "text-white"
              } hover:text-blue-400`
            }
          >
            Pricing
          </NavLink>
          <NavLink
            to="/reviews"
            className={({ isActive }) =>
              `transition-colors duration-200 ${
                isActive ? "text-blue-400" : "text-white"
              } hover:text-blue-400`
            }
          >
            Reviews
          </NavLink>
          <NavLink
            to="/user/userid"
            className={({ isActive }) =>
              `transition-colors duration-200 ${
                isActive ? "text-blue-400" : "text-white"
              } hover:text-blue-400`
            }
          >
            Profile
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `transition-colors duration-200 ${
                isActive ? "text-blue-400" : "text-white"
              } hover:text-blue-400`
            }
          >
            Contact Us
          </NavLink>
        </nav>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* <ThemeToggle /> */}
          <button
            className="px-4 py-1 border border-blue-400 text-white rounded hover:bg-blue-500/20 transition"
            onClick={() => setIsLoginCardOpen(true)}
          >
            Login
          </button>
          <button className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            onClick={() => setIsSignUpCardOpen(true)}>
            Sign Up
          </button>
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
                type="username"
                placeholder="Username"
                className="w-full border border-white/20 bg-slate-700/50 text-white placeholder-gray-400 px-3 py-2 rounded mb-3 focus:border-blue-400 focus:outline-none"
              />
              <input
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
              <button className="px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition">
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
                type="username"
                placeholder="Set Username"
                className="w-full border border-white/20 bg-slate-700/50 text-white placeholder-gray-400 px-3 py-2 rounded mb-3 focus:border-blue-400 focus:outline-none"
              />

              <input
                type="email"
                placeholder="Email"
                className="w-full border border-white/20 bg-slate-700/50 text-white placeholder-gray-400 px-3 py-2 rounded mb-3 focus:border-blue-400 focus:outline-none"
              />
              <input
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
              <button className="px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition">
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