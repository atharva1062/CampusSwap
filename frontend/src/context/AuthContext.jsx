import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('campusswap_token'));
  const [loading, setLoading] = useState(true);

  // Initialize and check authenticated user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const savedToken = localStorage.getItem('campusswap_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await API.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
        }
      } catch (err) {
        console.error('Session expired or invalid token:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Login handler (Supports College Email or ERP ID + compulsory registered phone verification)
  const login = async (identifier, password, phone) => {
    const res = await API.post('/auth/login', { identifier, password, phone });
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('campusswap_token', receivedToken);
      localStorage.setItem('campusswap_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true, user: receivedUser };
    }
    return { success: false, message: res.data.message };
  };

  // Verify student against pre-loaded college database
  const verifyStudent = async (identifier, phone) => {
    const res = await API.post('/auth/verify-student', { identifier, phone });
    return res.data;
  };

  // First-time student activation with password creation
  const activateStudent = async ({ identifier, phone, password, confirmPassword, avatar }) => {
    const res = await API.post('/auth/activate-student', {
      identifier,
      phone,
      password,
      confirmPassword,
      avatar,
    });
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('campusswap_token', receivedToken);
      localStorage.setItem('campusswap_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true, user: receivedUser };
    }
    return { success: false, message: res.data.message };
  };

  // Change password handler (e.g. after first login)
  const changePassword = async (currentPassword, newPassword) => {
    const res = await API.post('/auth/change-password', { currentPassword, newPassword });
    if (res.data.success) {
      setUser((prev) => ({ ...prev, hasChangedPassword: true }));
      return { success: true, message: res.data.message };
    }
    return { success: false, message: res.data.message };
  };

  // Register handler
  const register = async (userData) => {
    const res = await API.post('/auth/register', userData);
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('campusswap_token', receivedToken);
      localStorage.setItem('campusswap_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true, user: receivedUser };
    }
    return { success: false, message: res.data.message };
  };

  // Google / Gmail Login handler
  const googleLogin = async ({ email, name, avatar, collegeId, phone }) => {
    const res = await API.post('/auth/google', { email, name, avatar, collegeId, phone });
    if (res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('campusswap_token', receivedToken);
      localStorage.setItem('campusswap_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return { success: true, user: receivedUser };
    }
    return { success: false, message: res.data.message };
  };

  // Update profile handler
  const updateProfile = async (updatedFields) => {
    const res = await API.put('/auth/profile', updatedFields);
    if (res.data.success) {
      setUser((prev) => ({ ...prev, ...res.data.user }));
      localStorage.setItem('campusswap_user', JSON.stringify({ ...user, ...res.data.user }));
      return { success: true };
    }
    return { success: false, message: res.data.message };
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('campusswap_token');
    localStorage.removeItem('campusswap_user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        login,
        verifyStudent,
        activateStudent,
        changePassword,
        googleLogin,
        register,
        logout,
        updateProfile,
      }}
    >
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
