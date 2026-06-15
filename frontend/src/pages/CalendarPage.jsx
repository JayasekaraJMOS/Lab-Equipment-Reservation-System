import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { Calendar as CalendarIcon, Clock, Filter, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function CalendarPage() {
  const [reservations, setReservations] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [selectedEqId, setSelectedEqId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/equipment').then(res => setEquipmentList(res.data.equipment)).catch(console.error);
  }, []);

  const fetchCalendarReservations = () => {
    setLoading(true);
    let url = `/reservations?view=schedule&`;
    if (selectedEqId) url += `equipmentId=${selectedEqId}&`;

    api.get(url)
      .then(res => setReservations(res.data.reservations))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCalendarReservations();
  }, [selectedEqId]);

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Visual Schedule</span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Equipment Booking Calendar</h1>
          <p className="text-xs text-slate-500 mt-1">Inspect live time slots and reservation status across university laboratories.</p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <select
            value={selectedEqId}
            onChange={(e) => setSelectedEqId(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Equipment Schedule</option>
            {equipmentList.map(eq => (
              <option key={eq.id} value={eq.id}>{eq.name} ({eq.model})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Calendar Schedule List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Active & Upcoming Reservations</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-lg">
            Enforced 15-Minute Cooldown Buffer
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-medium">
            Loading schedule details...
          </div>
        ) : reservations.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-bold text-slate-800">No active bookings found</p>
            <p className="text-xs text-slate-500">Selected equipment has open availability slots.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reservations.map(res => {
              const start = new Date(res.start_time);
              const end = new Date(res.end_time);

              return (
                <div key={res.id} className="p-5 hover:bg-slate-50/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{res.equipment_name}</span>
                      <StatusBadge status={res.status} />
                    </div>
                    <p className="text-xs text-slate-500">
                      Reserved by: <span className="font-semibold text-slate-700">{res.user_name}</span> ({res.user_email})
                    </p>
                    <p className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg inline-block font-normal mt-1">
                      Purpose: {res.purpose}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border border-blue-200">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} | {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {res.admin_notes && (
                      <p className="text-[11px] text-slate-400 mt-1 italic">{res.admin_notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
