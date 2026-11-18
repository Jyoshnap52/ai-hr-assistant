import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit, Lock, Mail, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, error: authError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuickRoleSelect = (roleEmail, rolePassword) => {
    setEmail(roleEmail);
    setPassword(rolePassword);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header Branding */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-xs">
            <BrainCircuit className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">PeopleAI</h1>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Enterprise HR Platform</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SOC-2 Type II Certified
          </span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="max-w-sm w-full mx-auto my-auto py-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign in to workspace</h2>
            <p className="text-xs text-slate-500 font-normal">Enter your corporate credentials to access your account</p>
          </div>

          {/* Quick SSO Role Demo Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-500">Quick Authentication Demo</span>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => handleQuickRoleSelect('admin@company.com', 'admin123')}
                className={`py-1.5 px-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  email === 'admin@company.com'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                HR Admin
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleSelect('alex.rivera@company.com', 'emp123')}
                className={`py-1.5 px-2.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  email === 'alex.rivera@company.com'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Employee
              </button>
            </div>
          </div>

          {(error || authError) && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-lg text-center">
              {error || authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Single Sign-On Active
            </span>
            <span>256-Bit TLS Encrypted</span>
          </div>
        </div>
      </main>

      <footer className="text-center py-2">
        <p className="text-[11px] text-slate-400 font-medium">
          © 2026 PeopleAI Systems • Enterprise Confidential Access
        </p>
      </footer>
    </div>
  );
}
