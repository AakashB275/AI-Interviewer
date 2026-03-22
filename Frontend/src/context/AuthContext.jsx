import React, { useState, useCallback, useEffect } from 'react';
import { AuthContext } from './auth-context';
import { apiFetch } from './apiFetch';

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('authToken');

      if (!token) {
        setIsLoggedIn(false);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await apiFetch('/api/auth/me');

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setIsLoggedIn(true);
            setUser(data.user);
          } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('resumeUploaded');
            setIsLoggedIn(false);
            setUser(null);
          }
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('resumeUploaded');
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error verifying auth:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('resumeUploaded');
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = useCallback((token, userData = null) => {
    localStorage.setItem('authToken', token);
    if (userData) setUser(userData);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('resumeUploaded');
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, loading, login, logout, setUser, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
};
