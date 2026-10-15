import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu, Calendar, LayoutDashboard, LogOut, LogIn, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user, logout, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDemoSwitch = async (role) => {
    await demoLogin(role);
    if (role === 'admin' || role === 'tech') {
      navigate('/admin');
    } else {
      navigate('/catalog');
    }
  };

  const isActive = (path) => location.pathname === path ? 'text-blue-600 font-semibold' : 'text-slate-600 hover:text-blue-600';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Role Switcher Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-white font-semibold">Simulation Mode:</span>
          <span className="text-slate-400">Switch active user role:</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDemoSwitch('student')}
            className={`px-2.5 py-0.5 rounded text-xs font-medium transition ${user?.role === 'student' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            🎓 Student
          </button>
          <button
            onClick={() => handleDemoSwitch('tech')}
            className={`px-2.5 py-0.5 rounded text-xs font-medium transition ${user?.role === 'tech' ? 'bg-emerald-600 text-white font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            🔬 Lab Tech
          </button>
          <button
            onClick={() => handleDemoSwitch('admin')}
            className={`px-2.5 py-0.5 rounded text-xs font-medium transition ${user?.role === 'admin' ? 'bg-purple-600 text-white font-semibold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            ⚡ Admin
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 text-slate-900 font-bold text-lg tracking-tight">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <span>Lab<span className="text-blue-600">Reserve</span></span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/catalog" className={isActive('/catalog')}>
            Equipment Catalog
          </Link>
          <Link to="/calendar" className={isActive('/calendar')}>
            Schedule Calendar
          </Link>
          {user && (
            <Link to="/my-bookings" className={isActive('/my-bookings')}>
              My Reservations
            </Link>
          )}
          {(user?.role === 'tech' || user?.role === 'admin') && (
            <Link to="/admin" className={`flex items-center gap-1 px-3 py-1 rounded-lg ${location.pathname === '/admin' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}>
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              Supervisor Portal
            </Link>
          )}
        </nav>

        {/* User Auth Section */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-none">{user.name}</p>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 mt-1 inline-block">
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm shadow-sm hover:bg-blue-700 transition"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
