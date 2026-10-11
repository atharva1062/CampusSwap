import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null); // { message, type: 'success'|'error'|'info' }

  // Show a temporary toast message
  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, duration);
  }, []);

  // Fetch notifications for the user
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const res = await API.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      // Quiet fail on network issues
    }
  }, [user]);

  // Poll notifications periodically when user is logged in (every 60s)
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark single as read
  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toast,
        showToast,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}

      {/* Global Toast Notification Component */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in max-w-md">
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white text-sm font-medium transition-all transform ${
              toast.type === 'error'
                ? 'bg-rose-600 border border-rose-500'
                : toast.type === 'info'
                ? 'bg-blue-600 border border-blue-500'
                : 'bg-emerald-600 border border-emerald-500'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-auto text-white/80 hover:text-white font-bold text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
