import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Star,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Save,
  Lock,
  Sparkles,
  Camera,
  Trash2,
  CheckCircle2,
  KeyRound,
  BookOpen,
  Building2,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { DEPARTMENTS } from '../constants/departments';
import Avatar from '../components/Avatar';

export default function ProfilePage() {
  const { user: currentUser, updateProfile, changePassword, isAuthenticated } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  // Profile Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [campus, setCampus] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Reviews & Stats
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadProfile = async () => {
      try {
        const [meRes, reviewsRes] = await Promise.all([
          API.get('/auth/me'),
          API.get(`/reviews/user/${currentUser.id}`),
        ]);

        if (meRes.data.success) {
          const u = meRes.data.user;
          setName(u.name || '');
          setPhone(u.phone || '');
          setCollegeId(u.collegeId || '');
          setCampus(u.campus || 'Main Campus');
          setBio(u.bio || '');
          setAvatar(u.avatar || '');
          setAvatarUrlInput(u.avatar || '');
        }

        if (reviewsRes.data.success) {
          setReviews(reviewsRes.data.reviews || []);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isAuthenticated, currentUser]);

  // Save Profile Info
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await updateProfile({
        name,
        phone,
        campus,
        bio,
        avatar,
      });

      if (res.success) {
        showToast('Profile information saved successfully! 🎓', 'success');
      } else {
        showToast(res.message || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      showToast('Error updating profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Remove Profile Picture
  const handleRemoveAvatar = async () => {
    setAvatar('');
    setAvatarUrlInput('');
    try {
      const res = await updateProfile({ removeAvatar: true });
      if (res.success) {
        showToast('Profile picture removed. Initials avatar active.', 'success');
      }
    } catch (err) {
      showToast('Error removing profile picture.', 'error');
    }
  };

  // Handle Custom Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        showToast('Password updated! You can now use this for future logins.', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(res.message || 'Password update failed.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error changing password.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-400 text-xs">
        Loading student profile...
      </div>
    );
  }

  const userInitials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'CS';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-slate-700/50">
        <div className="flex items-center gap-5">
          
          {/* Avatar / Picture Display */}
          <div className="relative group">
            <Avatar
              src={avatar}
              alt={name}
              className="w-20 h-20 rounded-2xl ring-4 ring-white/20 shadow-md"
              iconClassName="w-10 h-10"
            />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black">{name}</h1>
              {currentUser?.role === 'ADMIN' ? (
                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold rounded-md">
                  Administrator
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-brand-500/20 text-brand-300 border border-brand-500/40 text-[10px] font-bold rounded-md flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified Student
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1 font-mono">
                <BookOpen className="w-3.5 h-3.5 text-brand-400" /> ERP: {collegeId || 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> {currentUser?.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> {phone || 'Not Provided'}
              </span>
            </p>
          </div>
        </div>

        {/* Member Status */}
        <div className="bg-white/10 backdrop-blur-xs px-4 py-3 rounded-2xl border border-white/10 text-right shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
            Campus ID Status
          </span>
          <span className="text-xs font-black text-emerald-300 flex items-center gap-1 mt-0.5 justify-end">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active & Verified
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar Selector & Profile Edit */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Avatar Customization Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-brand-600" /> Profile Picture
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Default is a blank contact image. You can optionally add a custom photo URL or reset it anytime.
                </p>
              </div>

              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Reset to Blank Contact
                </button>
              )}
            </div>

            {/* Current Avatar Status */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <Avatar
                src={avatar}
                alt={name}
                className="w-14 h-14 rounded-2xl ring-2 ring-slate-200"
                iconClassName="w-7 h-7"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 block">
                  {avatar ? 'Custom Photo Active' : 'Default Blank Contact Active'}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {avatar
                    ? 'Your custom photo is visible to peers across the marketplace.'
                    : 'Clean neutral silhouette contact image is displayed on your listings and chats.'}
                </span>
              </div>
            </div>

            {/* Custom Image URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Optional Custom Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Paste image link e.g. https://example.com/my-photo.jpg"
                  value={avatarUrlInput}
                  onChange={(e) => setAvatarUrlInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setAvatar(avatarUrlInput)}
                  disabled={!avatarUrlInput}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 shrink-0"
                >
                  Apply Photo
                </button>
              </div>
            </div>
          </div>

          {/* Profile Details Form */}
          <form
            onSubmit={handleSaveProfile}
            className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card space-y-4"
          >
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-brand-600" /> Student Profile Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Student ERP ID (Verified)
                </label>
                <input
                  type="text"
                  disabled
                  value={collegeId}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-100 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Registered Mobile Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
                  Academic Department
                </label>
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Student Bio / Swap Interests
              </label>
              <textarea
                rows="3"
                placeholder="Tell other campus students what you study, what gear you have, or what books you like to swap..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
              ></textarea>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>

        </div>

        {/* Right Column: Password Change & Security */}
        <div className="space-y-6">
          
          {/* Change Password Card */}
          <form
            onSubmit={handleChangePassword}
            className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card space-y-4"
          >
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-brand-600" /> Change Student Password
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Update your login password from the default registered mobile number.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Current Password / Mobile No. *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Current password or mobile number"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                New Custom Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {passwordLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>

          {/* Student Reputation & Feedback */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card space-y-4">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Campus Swap Feedback
            </h2>

            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                No reviews yet. Complete swap or sale transactions with peers to receive ratings!
              </p>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {rev.reviewer?.name}
                      </span>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        <Star className="w-3 h-3 fill-amber-500" />
                        <span className="text-[11px] font-bold">{rev.rating}.0</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
