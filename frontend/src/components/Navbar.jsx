import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  Bell,
  User,
  LogOut,
  ShoppingBag,
  ArrowLeftRight,
  ShieldCheck,
  MessageSquare,
  Bookmark,
  Menu,
  X,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Avatar from './Avatar';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm">
      {/* Official College Institutional Header Strip */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 text-white text-[11px] py-1 px-4 border-b border-brand-700/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold tracking-tight">
            <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse"></span>
            <span className="truncate">Dr. D. Y. Patil Institute of Technology, Pimpri, Pune (DIT Pimpri)</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-300 font-semibold">
            <span className="text-accent-300 font-bold">NAAC 'A++' Grade</span>
            <span>•</span>
            <span>SPPU Affiliated</span>
            <span>•</span>
            <span>Approved by AICTE</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-700/20 group-hover:scale-105 transition-transform border border-accent-400/40">
              <ArrowLeftRight className="w-6 h-6 stroke-[2.5] text-accent-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                  DIT <span className="text-brand-600">CampusSwap</span>
                </span>
                <span className="hidden md:inline-block px-1.5 py-0.2 bg-accent-100 text-accent-800 border border-accent-300 rounded text-[9px] font-black uppercase">
                  Pimpri
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 block -mt-0.5 tracking-wider uppercase">
                Official Student Marketplace
              </span>
            </div>
          </Link>

          {/* Search Bar (Desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-lg relative items-center"
          >
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search DIT textbooks, drafters, calculators, cycles, lab manuals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-24 py-2 text-xs font-semibold bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-brand-500 rounded-full focus:outline-none focus:ring-4 focus:ring-brand-500/15 transition-all text-slate-800 placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 px-3.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-bold shadow-xs transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600">
            <Link
              to="/browse"
              className={`px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/browse'
                  ? 'text-brand-600 bg-brand-50 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Explore Market
            </Link>
            <Link
              to="/browse?type=SWAP"
              className="px-3 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-amber-700 bg-amber-50/70 border border-amber-200/50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Swaps Only
            </Link>
          </nav>

          {/* Actions & User Section */}
          <div className="flex items-center gap-2.5">
            
            {/* Post Listing Button */}
            <Link
              to="/create-listing"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Item</span>
            </Link>

            {isAuthenticated ? (
              <>
                {/* Chat / Messages Link */}
                <Link
                  to="/messages"
                  title="Messages"
                  className="p-2 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-xl transition-colors relative"
                >
                  <MessageSquare className="w-5 h-5" />
                </Link>

                {/* Notifications Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-xl transition-colors relative"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Panel */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          Notifications
                          {unreadCount > 0 && (
                            <span className="text-xs bg-brand-100 text-brand-700 font-semibold px-2 py-0.5 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </h4>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-brand-600 hover:underline font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs">
                            No notifications yet!
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                markAsRead(n.id);
                                if (n.link) {
                                  navigate(n.link);
                                  setShowNotifications(false);
                                }
                              }}
                              className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                                !n.isRead ? 'bg-brand-50/40' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-slate-800">
                                  {n.title}
                                </p>
                                {!n.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1"></span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                {n.message}
                              </p>
                              <span className="text-[10px] text-slate-400 mt-1.5 block">
                                {new Date(n.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar Menu Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <Avatar
                      src={user?.avatar}
                      alt={user?.name}
                      className="w-8 h-8 rounded-lg"
                    />
                    <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 text-brand-700">
                          {user?.role}
                        </span>
                      </div>

                      <div className="py-1 text-sm font-medium text-slate-700">
                        <Link
                          to="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          Dashboard
                        </Link>
                        <Link
                          to="/my-listings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4 text-slate-400" />
                          My Listings
                        </Link>
                        <Link
                          to="/transactions"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                        >
                          <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                          Deals & Requests
                        </Link>
                        <Link
                          to="/saved"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                        >
                          <Bookmark className="w-4 h-4 text-slate-400" />
                          Saved Wishlist
                        </Link>

                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-rose-50 text-rose-700 font-semibold transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4 text-rose-500" />
                            Admin Safety Hub
                          </Link>
                        )}
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={() => {
                            logout();
                            setShowUserMenu(false);
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-medium transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-semibold text-slate-700 hover:text-brand-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
                >
                  Join Campus
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Search & Navigation Panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 space-y-3 animate-in fade-in">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-sm border-0 focus:ring-2 focus:ring-brand-500"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </form>

            <div className="grid grid-cols-2 gap-2 pt-2 text-sm font-medium">
              <Link
                to="/browse"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center"
              >
                Browse All
              </Link>
              <Link
                to="/create-listing"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-brand-600 text-white flex items-center justify-center font-semibold"
              >
                + Post Listing
              </Link>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
