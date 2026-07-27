import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X, Calendar, Clock, AlertTriangle, ShieldCheck, CheckCircle2, Info } from 'lucide-react';

export default function ReservationModal({ equipment, onClose, onSuccess }) {
  const [date, setDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [durationHours, setDurationHours] = useState(2);
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dayBookings, setDayBookings] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  if (!equipment) return null;

  const maxHours = equipment.max_hours_per_slot || 8;
  const hourOptions = Array.from({ length: maxHours }, (_, i) => i + 1);

  // Fetch active bookings for the selected date so the user can see existing reservations
  useEffect(() => {
    if (!equipment?.id || !date) return;
    setLoadingSchedule(true);
    api.get(`/reservations?equipmentId=${equipment.id}&schedule=true&date=${date}`)
      .then((res) => {
        setDayBookings(res.data.reservations || []);
      })
      .catch(() => setDayBookings([]))
      .finally(() => setLoadingSchedule(false));
  }, [equipment?.id, date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const startDateTime = new Date(`${date}T${startTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationHours * 3600000);

      const payload = {
        equipment_id: equipment.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        purpose: purpose || 'Academic Experiment / Lab Work'
      };

      const res = await api.post('/reservations', payload);
      setSuccessMsg(res.data.message);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit reservation request.');
    } finally {
      setLoading(false);
    }
  };

  const isCollision = error.toLowerCase().includes('conflict') || error.toLowerCase().includes('buffer');
  const isAuthError = error.toLowerCase().includes('token') || error.toLowerCase().includes('login');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              Equipment Booking
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-1">{equipment.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">
                {isCollision
                  ? 'Collision Conflict Detected:'
                  : isAuthError
                  ? 'Authentication Required:'
                  : 'Reservation Request Error:'}
              </p>
              <p className="mt-0.5 font-medium">{error}</p>
              {isAuthError && (
                <a href="/login" className="inline-block mt-2 font-bold text-blue-600 hover:underline">
                  Go to Login Page &rarr;
                </a>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="font-semibold">{successMsg}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reservation Date</label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Existing Schedule Availability on Selected Date */}
          <div className="space-y-1">
            {loadingSchedule ? (
              <div className="p-2 text-xs text-slate-400 italic">Checking schedule availability...</div>
            ) : dayBookings.length > 0 ? (
              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  Reserved Slots on {date} (15m buffer required):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {dayBookings.map((b) => {
                    const s = new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const e = new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <span key={b.id} className="px-2 py-0.5 bg-white border border-amber-300 rounded-md font-semibold text-[11px] text-amber-900 shadow-2xs">
                        🔒 {s} – {e} ({b.status})
                      </span>
                    );
                  })}
                </div>
                <p className="text-[11px] text-amber-800">
                  Tip: Choose a time before or after these intervals with at least a 15-minute gap.
                </p>
              </div>
            ) : (
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                  All slots are currently open on {date}.
                </span>
                <span className="font-semibold text-slate-700">Max limit: {maxHours} hrs</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (Hours) <span className="text-slate-400 font-normal">Max: {maxHours}h</span>
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {hourOptions.map((h) => (
                  <option key={h} value={h}>
                    {h} Hour{h > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Experiment / Usage Purpose</label>
            <textarea
              rows={2}
              required
              placeholder="E.g., EE4207 Oscilloscope signal analysis and pulse modulation test."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-normal"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              {equipment.requires_approval ? 'Requires Supervisor Approval' : 'Auto-Approve Enabled'}
            </span>
            <span className="font-semibold text-slate-900">Enforced 15m Buffer</span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? 'Validating Slot...' : 'Confirm Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
