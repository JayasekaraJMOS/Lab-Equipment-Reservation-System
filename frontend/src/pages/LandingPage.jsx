import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import EquipmentCard from '../components/EquipmentCard';
import EquipmentDetailModal from '../components/EquipmentDetailModal';
import ReservationModal from '../components/ReservationModal';
import { ShieldCheck, Calendar, Cpu, Sparkles, ArrowRight, Activity, Users, CheckCircle2, Award } from 'lucide-react';

export default function LandingPage() {
  const { user, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [featuredEquipment, setFeaturedEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [bookingEquipment, setBookingEquipment] = useState(null);

  useEffect(() => {
    api.get('/equipment')
      .then(res => setFeaturedEquipment(res.data.equipment.slice(0, 3)))
      .catch(console.error);
  }, []);

  const handleQuickDemo = async (role) => {
    await demoLogin(role);
    if (role === 'admin' || role === 'tech') {
      navigate('/admin');
    } else {
      navigate('/catalog');
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-blue-50/70 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-700 text-xs font-bold border border-blue-200 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              EE4207 – Web Application Development Project
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Smart University Lab <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Equipment Reservation
              </span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-normal">
              Digitize lab schedules, eliminate equipment collisions, and automate approval workflows for oscilloscopes, 3D printers, spectrum analyzers, and AI workstations.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:shadow-xl transition-all duration-200"
              >
                Browse Equipment Catalog
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/calendar"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-slate-700 font-bold text-sm border border-slate-200 shadow-xs hover:bg-slate-50 transition"
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                View Real-Time Calendar
              </Link>
            </div>

            {/* Demo Accounts Section */}
            <div className="pt-8 border-t border-slate-200/60 max-w-xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                ⚡ Demo Accounts (Quick Sign-In)
              </span>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleQuickDemo('student')}
                  className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-slate-800 font-semibold text-xs shadow-2xs hover:shadow-md transition flex flex-col items-center gap-1"
                >
                  <span className="text-base">🎓</span>
                  <span>Student</span>
                </button>
                <button
                  onClick={() => handleQuickDemo('tech')}
                  className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 text-slate-800 font-semibold text-xs shadow-2xs hover:shadow-md transition flex flex-col items-center gap-1"
                >
                  <span className="text-base">🔬</span>
                  <span>Lab Tech</span>
                </button>
                <button
                  onClick={() => handleQuickDemo('admin')}
                  className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:border-purple-400 text-slate-800 font-semibold text-xs shadow-2xs hover:shadow-md transition flex flex-col items-center gap-1"
                >
                  <span className="text-base">⚡</span>
                  <span>Administrator</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Anti-Collision Engine</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Real-time slot validation guarantees zero double-bookings. Automatically enforces a mandatory 15-minute calibration buffer between consecutive lab sessions.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Role-Based Workflows</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Dedicated interfaces for Students, Lab Supervisors, and Department Admins. Auto-approve standard tools while requiring supervisor review for high-value machinery.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Analytics & Maintenance</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Track equipment utilization rates (%), maintenance logs, repair status, and peak usage hours with real-time department analytics.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Equipment Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Inventory Preview</span>
            <h2 className="text-2xl font-bold text-slate-900">Featured Laboratory Equipment</h2>
          </div>
          <Link to="/catalog" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All Equipment ({featuredEquipment.length}+)
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredEquipment.map(item => (
            <EquipmentCard
              key={item.id}
              equipment={item}
              onSelect={setSelectedEquipment}
              onReserve={setBookingEquipment}
            />
          ))}
        </div>
      </section>

      {/* Modals */}
      {selectedEquipment && (
        <EquipmentDetailModal
          equipment={selectedEquipment}
          onClose={() => setSelectedEquipment(null)}
          onReserve={setBookingEquipment}
        />
      )}

      {bookingEquipment && (
        <ReservationModal
          equipment={bookingEquipment}
          onClose={() => setBookingEquipment(null)}
          onSuccess={() => alert('Reservation requested successfully!')}
        />
      )}
    </div>
  );
}
