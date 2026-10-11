import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeftRight,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  KeyRound,
  Phone,
  BookOpen,
  X,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  UserCheck,
  Building2,
  User,
  Smartphone,
  Eye,
  EyeOff,
  GraduationCap
} from 'lucide-react';
import API from '../services/api';
import { auth } from '../services/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { DEPARTMENTS } from '../constants/departments';

export default function LoginPage() {
  const { login, register, verifyStudent, activateStudent } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'signup') {
      setAuthMode('signup');
    }
  }, [location]);

  // Login Form States
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sign Up / Verification Form States
  const [signupIdentifier, setSignupIdentifier] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifiedStudent, setVerifiedStudent] = useState(null); // When student is verified in roster
  const [verificationError, setVerificationError] = useState('');
  const [allowManualSignup, setAllowManualSignup] = useState(false);

  // Student Account Creation Fields (Shown after verification)
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupCollegeId, setSignupCollegeId] = useState('');
  const [signupDepartment, setSignupDepartment] = useState(DEPARTMENTS[3]); // Default to Computer Engineering
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  // OTP Flow States (Required if phone does not exist in college roster)
  const [needsPhoneOtp, setNeedsPhoneOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  // Forgot / Reset Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetOtpCode, setResetOtpCode] = useState('');
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtpVerified, setResetOtpVerified] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState(null);

  // Handle Standard Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      showToast('Please enter your College Email / Student ERP ID and Password.', 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await login(identifier, password, phone);
      if (res.success) {
        showToast(`Welcome to DIT CampusSwap, ${res.user.name}! 🎓`, 'success');
        if (res.user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/browse');
        }
      } else {
        showToast(res.message || 'Login failed. Please check your credentials.', 'error');
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Login failed. Please check your credentials.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Setup invisible Firebase Recaptcha
  const setupRecaptcha = (containerId = 'recaptcha-container') => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}
      window.recaptchaVerifier = null;
    }

    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch (e) {}
          window.recaptchaVerifier = null;
        }
      },
    });

    return window.recaptchaVerifier;
  };

  // Send Firebase Phone SMS OTP
  const handleSendOtp = async () => {
    const rawDigits = signupPhone.replace(/\D/g, '');
    if (rawDigits.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    setOtpLoading(true);
    try {
      const appVerifier = setupRecaptcha();
      const formattedPhone = `+91${rawDigits}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      showToast(`OTP SMS sent to ${formattedPhone}! Check your phone.`, 'success');
    } catch (err) {
      console.error('Firebase SMS Error:', err);
      showToast(err.message || 'Failed to send SMS OTP. Please try again.', 'error');
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify Firebase Phone SMS OTP
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.trim().length < 6) {
      showToast('Please enter the 6-digit OTP received on your phone.', 'error');
      return;
    }

    if (!confirmationResult) {
      showToast('Please request an OTP first.', 'error');
      return;
    }

    setOtpLoading(true);
    try {
      await confirmationResult.confirm(otpCode.trim());
      setOtpVerified(true);
      showToast('Phone number successfully verified! You can now create your password.', 'success');
    } catch (err) {
      console.error('Verify OTP Error:', err);
      showToast('Invalid OTP. Please check the code and try again.', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 1: Verify Student ERP ID or College Email
  const handleVerifyStudentId = async (e) => {
    if (e) e.preventDefault();
    const cleanId = signupIdentifier.trim();
    if (!cleanId) {
      showToast('Please enter your Student ERP ID or College Email.', 'error');
      return;
    }

    setVerifyLoading(true);
    setVerificationError('');
    setVerifiedStudent(null);
    setAllowManualSignup(false);
    setNeedsPhoneOtp(false);
    setOtpSent(false);
    setOtpVerified(false);

    try {
      const res = await verifyStudent(cleanId, signupPhone);
      if (res.success && res.student) {
        setVerifiedStudent(res.student);
        setSignupName(res.student.name || '');
        setSignupEmail(res.student.email || (cleanId.includes('@') ? cleanId : `${cleanId.toLowerCase()}@college.edu`));
        setSignupCollegeId(res.student.collegeId || cleanId.toUpperCase());

        // Check if phone number is present in college roster database
        if (res.student.phone && res.student.phone.trim().length >= 10) {
          setSignupPhone(res.student.phone);
          setNeedsPhoneOtp(false);
          setOtpVerified(true);
          showToast(`Verified! Welcome ${res.student.name}. Your phone is pre-verified. Create your password below.`, 'success');
        } else {
          // Phone number NOT present in database -> Mandatory input + SMS OTP required!
          setNeedsPhoneOtp(true);
          setOtpVerified(false);
          showToast(`Verified ERP! Please enter your phone number to receive a verification OTP.`, 'info');
        }

        if (res.student.department) {
          const matchedDept = DEPARTMENTS.find(
            (d) => d.toLowerCase() === res.student.department.toLowerCase()
          );
          setSignupDepartment(matchedDept || res.student.department);
        }
      } else {
        setVerificationError(res.message || 'Verification Failed: Only students listed in the official DIT Student Roster can register.');
        setAllowManualSignup(false);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification Failed: Only students listed in the official DIT Student Roster can register.';
      setVerificationError(msg);
      setAllowManualSignup(false);
    } finally {
      setVerifyLoading(false);
    }
  };

  // Step 2: Handle Password Creation & Account Completion
  const handleCompleteAccountCreation = async (e) => {
    e.preventDefault();

    if (!signupPassword || signupPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      showToast('Passwords do not match. Please re-check.', 'error');
      return;
    }

    if (signupPhone && signupPhone.replace(/\D/g, '').length > 0 && signupPhone.replace(/\D/g, '').length < 10) {
      showToast('If provided, mobile phone number must be 10 digits.', 'error');
      return;
    }

    setSignupLoading(true);

    try {
      let res;
      if (verifiedStudent) {
        // Activate existing roster student
        res = await activateStudent({
          identifier: signupCollegeId || signupIdentifier,
          phone: signupPhone,
          password: signupPassword,
          confirmPassword: signupConfirmPassword,
          name: signupName,
          department: signupDepartment,
        });
      } else {
        // Direct register
        res = await register({
          name: signupName,
          email: signupEmail,
          collegeId: signupCollegeId,
          phone: signupPhone,
          password: signupPassword,
          campus: signupDepartment,
        });
      }

      if (res.success) {
        showToast(`Account successfully created! Welcome ${res.user.name} 🎓`, 'success');
        navigate('/browse');
      } else {
        showToast(res.message || 'Registration failed.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to complete registration.', 'error');
    } finally {
      setSignupLoading(false);
    }
  };

  // Reset verification to enter another ID
  const handleResetVerification = () => {
    setVerifiedStudent(null);
    setVerificationError('');
    setAllowManualSignup(false);
    setSignupPassword('');
    setSignupConfirmPassword('');
  };

  // 1-Click Instant Demo Login
  const handleQuickLogin = async (demoId, demoPass, demoPhone = '') => {
    setIdentifier(demoId);
    setPassword(demoPass);
    if (demoPhone) setPhone(demoPhone);
    setLoading(true);
    try {
      const res = await login(demoId, demoPass, demoPhone);
      if (res.success) {
        showToast(`Logged in as ${res.user.name}! 🎓`, 'success');
        if (res.user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/browse');
        }
      } else {
        showToast(res.message || 'Login failed.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Quick login error.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Send Firebase Phone SMS OTP for Forgot Password
  const handleSendResetOtp = async () => {
    const rawDigits = resetPhone.replace(/\D/g, '');
    if (rawDigits.length !== 10) {
      showToast('Please enter your valid 10-digit registered mobile number.', 'error');
      return;
    }

    setResetLoading(true);
    try {
      const appVerifier = setupRecaptcha();
      const formattedPhone = `+91${rawDigits}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setResetConfirmation(confirmation);
      setResetOtpSent(true);
      showToast(`Password Reset OTP sent to ${formattedPhone}! Check your phone.`, 'success');
    } catch (err) {
      console.error('Reset OTP SMS Error:', err);
      showToast(err.message || 'Failed to send SMS OTP. Please try again.', 'error');
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setResetLoading(false);
    }
  };

  // Verify Firebase Phone SMS OTP for Forgot Password
  const handleVerifyResetOtp = async () => {
    if (!resetOtpCode || resetOtpCode.trim().length < 6) {
      showToast('Please enter the 6-digit OTP received on your phone.', 'error');
      return;
    }

    if (!resetConfirmation) {
      showToast('Please request an OTP first.', 'error');
      return;
    }

    setResetLoading(true);
    try {
      await resetConfirmation.confirm(resetOtpCode.trim());
      setResetOtpVerified(true);
      showToast('Phone verified! You can now set your new password.', 'success');
    } catch (err) {
      console.error('Verify Reset OTP Error:', err);
      showToast('Invalid OTP. Please check the code and try again.', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  // Handle Reset Password Submit
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetOtpVerified) {
      showToast('Please verify your mobile number with OTP first.', 'error');
      return;
    }

    if (resetNewPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }

    setResetLoading(true);
    try {
      const res = await API.post('/auth/reset-password', {
        identifier: resetIdentifier,
        phone: resetPhone,
        newPassword: resetNewPassword,
      });

      if (res.data.success) {
        showToast(res.data.message, 'success');
        setIdentifier(resetIdentifier);
        setPhone(resetPhone);
        setPassword(resetNewPassword);
        setForgotModalOpen(false);
        setResetIdentifier('');
        setResetPhone('');
        setResetNewPassword('');
        setResetOtpCode('');
        setResetOtpSent(false);
        setResetOtpVerified(false);
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Verification failed. Please check your ERP ID & Phone.',
        'error'
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 py-8 bg-gradient-to-b from-brand-50/40 via-slate-50 to-amber-50/20">
      <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-brand-700/20 border border-accent-400/40">
            <ArrowLeftRight className="w-7 h-7 stroke-[2.5] text-accent-200" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-accent-700 bg-accent-50 px-2.5 py-0.5 rounded-full border border-accent-200 inline-block mb-1">
              Dr. D. Y. Patil Institute of Technology, Pimpri
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              DIT Student Portal
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Access is strictly restricted to verified <span className="font-bold text-slate-700">College Email</span> and <span className="font-bold text-slate-700">Student ERP IDs</span>.
          </p>
        </div>

        {/* Mode Switcher: Log In vs Sign Up */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              handleResetVerification();
            }}
            className={`py-2 text-xs font-black rounded-xl transition-all ${
              authMode === 'login'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Log In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`py-2 text-xs font-black rounded-xl transition-all ${
              authMode === 'signup'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account / Sign Up
          </button>
        </div>

        {/* ========================================================= */}
        {/* MODE 1: LOG IN */}
        {/* ========================================================= */}
        {authMode === 'login' && (
          <div className="space-y-5 animate-in fade-in">
            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  8-Digit ERP ID or College Email *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 20241042 or 20241042.dit@dypvp.edu.in"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Registered Mobile No. (Optional)</span>
                  <span className="text-[10px] text-slate-400 font-normal lowercase">optional</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="e.g. 9823456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetIdentifier(identifier);
                      setResetPhone(phone);
                      setForgotModalOpen(true);
                    }}
                    className="text-[11px] font-bold text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
              >
                {loading ? 'Authenticating with DIT...' : 'Log In to DIT CampusSwap'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 2: SIGN UP WITH STEP-BY-STEP ID VERIFICATION */}
        {/* ========================================================= */}
        {authMode === 'signup' && (
          <div className="space-y-4 animate-in fade-in">
            
            {/* STEP 1: Enter ERP ID / Email & Verify */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-600" />
                  Step 1: Enter College ERP ID / Email
                </span>
                {verifiedStudent && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  8-Digit Student ERP ID or College Email *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      disabled={!!verifiedStudent}
                      placeholder="e.g. 20241042 or 20241042.dit@dypvp.edu.in"
                      value={signupIdentifier}
                      onChange={(e) => setSignupIdentifier(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !verifiedStudent) {
                          e.preventDefault();
                          handleVerifyStudentId();
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-600"
                    />
                    <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  {!verifiedStudent ? (
                    <button
                      type="button"
                      disabled={verifyLoading || !signupIdentifier.trim()}
                      onClick={handleVerifyStudentId}
                      className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                    >
                      {verifyLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      Verify
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetVerification}
                      className="px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all shrink-0"
                    >
                      Change ID
                    </button>
                  )}
                </div>
              </div>

              {/* Verification Feedback Banner */}
              {verifiedStudent && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-emerald-900">
                      College Student Record Verified: {verifiedStudent.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-800 flex flex-wrap gap-x-3 gap-y-1">
                    <span>ERP: <strong>{verifiedStudent.collegeId}</strong></span>
                    <span>Dept: <strong>{verifiedStudent.department}</strong></span>
                    {verifiedStudent.phone && <span>Mobile: <strong>{verifiedStudent.phone}</strong></span>}
                  </div>

                  {verifiedStudent.isAlreadyRegistered && (
                    <div className="mt-2 pt-2 border-t border-emerald-200 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-700">Account already has a password set.</span>
                      <button
                        type="button"
                        onClick={() => setAuthMode('login')}
                        className="text-[10px] font-bold text-brand-700 underline"
                      >
                        Go to Log In →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Error banner if not in roster */}
              {verificationError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs text-rose-900 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    Verification Failed
                  </div>
                  <p className="text-[11px] font-medium leading-relaxed">{verificationError}</p>
                  <p className="text-[10px] text-rose-700 font-bold pt-1">
                    Unverified users cannot create an account. Only official DIT students verified against campus records are permitted.
                  </p>
                </div>
              )}
            </div>

            {/* STEP 2: PASSWORD CREATION BAR & PROFILE DETAILS */}
            {/* Appears EXCLUSIVELY once student ERP ID or College Email is verified */}
            {verifiedStudent && (
              <form onSubmit={handleCompleteAccountCreation} className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-2">
                
                <div className="border-t border-slate-200 pt-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <KeyRound className="w-4 h-4 text-accent-600" />
                    Step 2: Student Details & Create Password
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Atharva Patil"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      8-Digit Student ERP ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 20241042"
                      value={signupCollegeId || signupIdentifier}
                      onChange={(e) => setSignupCollegeId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Mobile Number {needsPhoneOtp ? <span className="text-rose-600 font-extrabold">* (Mandatory)</span> : <span className="text-emerald-600 font-bold">✓ (Pre-Verified)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required={needsPhoneOtp}
                        disabled={!needsPhoneOtp || otpVerified}
                        placeholder="e.g. 9823456789 (10 digits)"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2 text-xs font-semibold border rounded-xl text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none ${
                          needsPhoneOtp && !otpVerified
                            ? 'bg-amber-50 border-amber-300'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>

                    {/* Invisible ReCAPTCHA Container for Firebase */}
                    <div id="recaptcha-container"></div>

                    {/* Phone OTP Verification Box if phone not in database */}
                    {needsPhoneOtp && !otpVerified && (
                      <div className="mt-2.5 p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-900">
                            Mobile Verification Required
                          </span>
                          {!otpSent ? (
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={otpLoading || signupPhone.replace(/\D/g, '').length !== 10}
                              className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs transition-all disabled:opacity-50"
                            >
                              {otpLoading ? 'Sending...' : 'Send SMS OTP'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={otpLoading}
                              className="text-[10px] font-bold text-amber-700 underline"
                            >
                              Resend OTP
                            </button>
                          )}
                        </div>

                        {otpSent && (
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="Enter 6-digit OTP"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              className="flex-1 px-3 py-1.5 text-xs font-mono font-bold bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-center tracking-widest"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyOtp}
                              disabled={otpLoading || otpCode.length < 6}
                              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-all disabled:opacity-50"
                            >
                              {otpLoading ? 'Verifying...' : 'Verify'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {otpVerified && needsPhoneOtp && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mobile number verified via SMS OTP!
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Official College Email *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. 20241042.dit@dypvp.edu.in"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
                    Department *
                  </label>
                  <select
                    value={signupDepartment}
                    onChange={(e) => setSignupDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Password Creation Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-brand-50/40 p-3.5 rounded-2xl border border-brand-200/80">
                  <div>
                    <label className="block text-xs font-bold text-brand-900 uppercase tracking-wider mb-1">
                      Create Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        placeholder="Min. 6 characters"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-900 uppercase tracking-wider mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        placeholder="Confirm password"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={signupLoading || (needsPhoneOtp && !otpVerified)}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {signupLoading
                    ? 'Creating Student Account...'
                    : needsPhoneOtp && !otpVerified
                    ? 'Verify Mobile Number to Continue'
                    : 'Complete Registration & Activate Account'}
                </button>
              </form>
            )}

          </div>
        )}

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 font-semibold text-brand-700">
            <Building2 className="w-3.5 h-3.5" /> DIT Pimpri, Pune
          </span>
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Campus Only
          </span>
        </div>

      </div>

      {/* Forgot / Reset Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-brand-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-accent-300" />
                <h3 className="font-bold text-sm">Reset Student Password</h3>
              </div>
              <button
                onClick={() => setForgotModalOpen(false)}
                className="p-1 rounded-full text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Verify your registered Student ERP ID or College Email along with your matching Mobile Number to set a new password.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  College Email or Student ERP ID *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. atharva@college.edu or CS-2024-042"
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
                  />
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Registered Mobile Number *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    disabled={resetOtpVerified}
                    placeholder="e.g. 9823456789"
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                {/* Send & Verify OTP Box */}
                {!resetOtpVerified && (
                  <div className="mt-2 p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-900">
                        Phone Verification Required
                      </span>
                      {!resetOtpSent ? (
                        <button
                          type="button"
                          onClick={handleSendResetOtp}
                          disabled={resetLoading || resetPhone.replace(/\D/g, '').length !== 10}
                          className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs transition-all disabled:opacity-50"
                        >
                          {resetLoading ? 'Sending...' : 'Send SMS OTP'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendResetOtp}
                          disabled={resetLoading}
                          className="text-[10px] font-bold text-amber-700 underline"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    {resetOtpSent && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="6-digit OTP"
                          value={resetOtpCode}
                          onChange={(e) => setResetOtpCode(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs font-mono font-bold bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-center tracking-widest"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyResetOtp}
                          disabled={resetLoading || resetOtpCode.length < 6}
                          className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-all disabled:opacity-50"
                        >
                          {resetLoading ? 'Verifying...' : 'Verify'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {resetOtpVerified && (
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mobile number verified via OTP!
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Create New Password *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    disabled={!resetOtpVerified}
                    placeholder="Minimum 6 characters"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 text-slate-900 disabled:opacity-50"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {resetLoading ? 'Verifying & Updating...' : 'Set New Password'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
