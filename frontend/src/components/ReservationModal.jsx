import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { X, Calendar, Clock, AlertTriangle, ShieldCheck, CheckCircle2, Info, ArrowRight } from 'lucide-react';

const LAB_START_HOUR = 8;  // 8:00 AM
const LAB_END_HOUR = 16;   // 4:00 PM (16:00)

// Generate standard time slots from 8:00 AM to 3:30 PM (Lab operating hours 8 AM - 4 PM)
const TIME_SLOTS = [];
for (let h = LAB_START_HOUR; h < LAB_END_HOUR; h++) {
  const padH = String(h).padStart(2, '0');
  const labelH = h > 12 ? h - 12 : h;
  const ampm = h >= 12 ? 'PM' : 'AM';

  TIME_SLOTS.push({
    value: `${padH}:00`,
    label: `${String(labelH).padStart(2, '0')}:00 ${ampm}`,
    hour: h,
    minute: 0
  });
  TIME_SLOTS.push({
    value: `${padH}:30`,
    label: `${String(labelH).padStart(2, '0')}:30 ${ampm}`,
    hour: h,
    minute: 30
  });
}

function checkSlotCollision(slotValue, dateStr, bookings) {
  if (!bookings || bookings.length === 0) return null;
  const slotTime = new Date(`${dateStr}T${slotValue}:00`).getTime();
  const bufferMs = 15 * 60 * 1000;

  for (const b of bookings) {
    const bStart = new Date(b.start_time).getTime() - bufferMs;
    const bEnd = new Date(b.end_time).getTime() + bufferMs;
    if (slotTime >= bStart && slotTime < bEnd) {
      return b;
    }
  }
  return null;
}

export default function ReservationModal({ equipment, onClose, onSuccess }) {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [durationHours, setDurationHours] = useState(2);
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dayBookings, setDayBookings] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  if (!equipment) return null;

  // Fetch active schedule for this equipment on the selected date
  useEffect(() => {
    if (!equipment?.id || !date) return;
    setLoadingSchedule(true);
    api.get(`/reservations?equipmentId=${equipment.id}&schedule=true&date=${date}`)
      .then((res) => {
        const bookings = res.data.reservations || [];
        setDayBookings(bookings);

        // Auto-select the first collision-free slot if current slot is occupied
        const currentConflict = checkSlotCollision(startTime, date, bookings);
        if (currentConflict) {
          const firstFree = TIME_SLOTS.find(s => !checkSlotCollision(s.value, date, bookings));
          if (firstFree) setStartTime(firstFree.value);
        }
      })
      .catch(() => setDayBookings([]))
      .finally(() => setLoadingSchedule(false));
  }, [equipment?.id, date]);

  // Calculate allowed durations based on selected start time and 4:00 PM lab closing
  const selectedSlot = useMemo(() => {
    return TIME_SLOTS.find(s => s.value === startTime) || TIME_SLOTS[0];
  }, [startTime]);

  const hoursUntilClosing = Math.max(1, Math.floor(LAB_END_HOUR - (selectedSlot.hour + selectedSlot.minute / 60)));
  const maxHours = Math.min(equipment.max_hours_per_slot || 8, hoursUntilClosing);
  const durationOptions = Array.from({ length: Math.max(1, maxHours) }, (_, i) => i + 1);

  // Auto-clamp duration if it exceeds closing time
  useEffect(() => {
    if (durationHours > maxHours) {
      setDurationHours(maxHours);
    }
  }, [maxHours, durationHours]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const startDateTime = new Date(`${date}T${startTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationHours * 3600000);

      // Validate closing time (4:00 PM)
      const closingTime = new Date(`${date}T16:00:00`);
      if (endDateTime > closingTime) {
        setError('Reservations cannot extend past lab closing time (4:00 PM). Please pick an earlier slot or shorter duration.');
        setLoading(false);
        return;
      }

      const payload = {
        equipment_id: equipment.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        purpose: purpose.trim() || 'EE4207 Academic Experiment'
      };

      const res = await api.post('/reservations', payload);
      setSuccessMsg(res.data.message || 'Reservation confirmed successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
        navigate('/my-bookings');
      }, 1200);
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
              Lab Operating Hours: 8:00 AM – 4:00 PM
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
                  Click here to sign in &rarr;
                </a>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="font-semibold">{successMsg}</p>
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">Opening My Reservations...</span>
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
              <div className="p-2 text-xs text-slate-400 italic">Checking lab equipment schedule...</div>
            ) : dayBookings.length > 0 ? (
              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-950 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  Reserved Intervals on {date} (15m buffer enforced):
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
              </div>
            ) : (
              <div className="px-3 py-2 rounded-xl bg-emerald-50/80 border border-emerald-200/60 text-xs text-emerald-900 flex items-center justify-between">
                <span className="flex items-center gap-1 font-medium">
                  <Info className="w-3.5 h-3.5 text-emerald-600" />
                  All lab slots open on {date} (8:00 AM – 4:00 PM).
                </span>
                <span className="font-semibold text-emerald-800">Max: {equipment.max_hours_per_slot || 8}h</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Start Time restricted to 8:00 AM – 4:00 PM */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Time (8 AM – 4 PM)
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {TIME_SLOTS.map((slot) => {
                  const conflict = checkSlotCollision(slot.value, date, dayBookings);
                  return (
                    <option
                      key={slot.value}
                      value={slot.value}
                      disabled={!!conflict}
                      className={conflict ? 'text-slate-400 bg-slate-100' : 'text-slate-900 font-medium'}
                    >
                      {slot.label} {conflict ? '— (Occupied)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Duration (Hours) restricted to 4:00 PM closing limit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (Hours) <span className="text-slate-400 font-normal">Max: {maxHours}h</span>
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {durationOptions.map((h) => (
                  <option key={h} value={h}>
                    {h} Hour{h > 1 ? 's' : ''} (until {selectedSlot.hour + h > 12 ? (selectedSlot.hour + h - 12) : (selectedSlot.hour + h)}:{selectedSlot.minute === 0 ? '00' : '30'} {selectedSlot.hour + h >= 12 ? 'PM' : 'AM'})
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
