import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Automatically redirect /register to /login (which handles verified student registration)
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Redirecting to DIT Student Verification Portal...</p>
      </div>
    </div>
  );
}
