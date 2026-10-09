import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Lock, Mail, User, Phone, BookOpen, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [campus, setCampus] = useState('Main Engineering Campus');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        name,
        email,
        password,
        collegeId,
        campus,
        phone,
      });

      if (res.success) {
        showToast('Account verified & created! Welcome to CampusSwap 🎉', 'success');
        navigate('/dashboard');
      } else {
        showToast(res.message || 'Registration failed.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration error. Please check your details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-slate-200/90 shadow-card space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 mx-auto flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <ArrowLeftRight className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Create Student Account
          </h1>
          <p className="text-xs text-slate-500">
            Join the verified peer-to-peer campus marketplace
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. Atharva Patil"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              College Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="atharva@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              💡 Uses your official college or campus student domain
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Student ERP / Roll No. *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. CS-2024-042"
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Registered Mobile No. *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9823456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Min. 6 chars (or Mobile No.)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Campus Location
              </label>
              <input
                type="text"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
          >
            {loading ? 'Verifying Student Account...' : 'Register & Start Swapping'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-600 hover:underline">
              Log in here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
