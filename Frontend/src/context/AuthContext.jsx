import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state and verify token validity
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setIsLoggedIn(false);
        setUser(null);
        setLoading(false);
        return;
      }

      // Verify token with backend
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setIsLoggedIn(true);
            setUser(data.user);
          } else {
            // Invalid token
            localStorage.removeItem('authToken');
            localStorage.removeItem('resumeUploaded');
            setIsLoggedIn(false);
            setUser(null);
          }
        } else {
          // Token invalid or expired
          localStorage.removeItem('authToken');
          localStorage.removeItem('resumeUploaded');
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error verifying auth:', error);
        // On error, clear token to force login
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
    if (userData) {
      setUser(userData);
    }
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('resumeUploaded');
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  const value = {
    isLoggedIn,
    user,
    loading,
    login,
    logout,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
