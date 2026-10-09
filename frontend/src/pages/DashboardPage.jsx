import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowLeftRight,
  Star,
  Bookmark,
  PlusCircle,
  MessageSquare,
  ShieldCheck,
  Clock,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import Avatar from '../components/Avatar';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [myListings, setMyListings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const [listingsRes, txRes, meRes] = await Promise.all([
          API.get('/listings/my-listings'),
          API.get('/transactions'),
          API.get('/auth/me'),
        ]);

        if (listingsRes.data.success) {
          setMyListings(listingsRes.data.listings);
        }
        if (txRes.data.success) {
          setTransactions(txRes.data.transactions);
        }
        if (meRes.data.success) {
          setStats(meRes.data.user);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated]);

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading your student dashboard...</div>;
  }

  const pendingRequests = transactions.filter(
    (t) => t.sellerId === user?.id && t.status === 'PENDING'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Avatar
            src={user?.avatar}
            alt={user?.name}
            className="w-16 h-16 rounded-2xl ring-2 ring-brand-400"
            iconClassName="w-8 h-8"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black">{user?.name}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Verified Student
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {user?.collegeId ? `ID: ${user.collegeId} • ` : ''}
              {user?.campus || 'Main Campus'} • {user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/create-listing"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" /> Post New Item
          </Link>
          <Link
            to="/profile"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-600 transition-colors"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Active Listings</span>
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {myListings.filter((l) => l.status === 'AVAILABLE').length}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Pending Requests</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">
            {pendingRequests.length}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Completed Deals</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {transactions.filter((t) => t.status === 'COMPLETED').length}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Campus Rating</span>
            <div className="p-2 bg-yellow-50 text-amber-500 rounded-xl">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <p className="text-2xl font-black text-slate-900">
              {stats?.averageRating || '5.0'}
            </p>
            <span className="text-xs text-slate-400">/ 5.0</span>
          </div>
        </div>

      </div>

      {/* Pending Deal Alert if any */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                You have {pendingRequests.length} incoming item request(s) awaiting your response!
              </h4>
              <p className="text-[11px] text-amber-700">
                Review proposed swaps, rent terms, or buy offers in your transactions hub.
              </p>
            </div>
          </div>
          <Link
            to="/transactions"
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
          >
            Review Requests
          </Link>
        </div>
      )}

      {/* My Active Listings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Your Posted Items</h2>
            <p className="text-xs text-slate-500">Manage listings or update availability</p>
          </div>
          <Link
            to="/my-listings"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            Manage All ({myListings.length}) <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {myListings.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
            <p className="text-xs text-slate-500">You haven't posted any items yet.</p>
            <Link
              to="/create-listing"
              className="inline-flex items-center gap-1 px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Post Your First Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {myListings.slice(0, 4).map((item) => (
              <ProductCard key={item.id} listing={item} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
