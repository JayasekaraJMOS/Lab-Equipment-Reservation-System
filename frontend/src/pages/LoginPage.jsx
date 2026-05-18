import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu, LogIn, UserPlus, Sparkles, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, register, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Electrical & Electronic Engineering');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password, department);
      } else {
        await login(email, password);
      }
      navigate('/catalog');
    } catch (err) {
      setError(
        err.response?.data?.error ||
        (err.response
          ? `Authentication failed (HTTP ${err.response.status}).`
          : 'Cannot reach the LabReserve API. Start the backend and check its database connection.')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (roleType) => {
    setError('');
    setLoading(true);
    try {
      await demoLogin(roleType);
      if (roleType === 'admin' || roleType === 'tech') {
        navigate('/admin');
      } else {
        navigate('/catalog');
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        (err.response
          ? `Demo login failed (HTTP ${err.response.status}). Check the backend configuration.`
          : 'Cannot reach the LabReserve API. Start the backend and check its database connection.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
            <Cpu className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isRegister ? 'Create Your Account' : 'Sign In to LabReserve'}
          </h2>
          <p className="text-xs text-slate-500">
            EE4207 Web Application Development Portal
          </p>
        </div>

        {/* 1-Click Viva Demo Section */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              1-Click Viva Demo Quick Login:
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemo('student')}
              className="py-2 px-2.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-slate-700 font-semibold text-xs shadow-2xs hover:shadow transition"
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => handleDemo('tech')}
              className="py-2 px-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 text-slate-700 font-semibold text-xs shadow-2xs hover:shadow transition"
            >
              🔬 Lab Tech
            </button>
            <button
              type="button"
              onClick={() => handleDemo('admin')}
              className="py-2 px-2.5 rounded-xl bg-white border border-slate-200 hover:border-purple-400 text-slate-700 font-semibold text-xs shadow-2xs hover:shadow transition"
            >
              ⚡ Admin
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">University Email</label>
            <input
              type="email"
              required
              placeholder="student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition"
          >
            {loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle Login / Register */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register here'}
          </button>
        </div>
      </div>
    </div>
  );
}
