import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { Clock, XCircle, AlertCircle, RefreshCw, Pencil, Trash2, Check, X } from 'lucide-react';

function localDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function localTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [myReservations, setMyReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReservation, setEditingReservation] = useState(null);

  const fetchMyBookings = () => {
    setLoading(true);
    api.get('/reservations')
      .then(res => setMyReservations(res.data.reservations))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation slot?')) return;

    try {
      await api.patch(`/reservations/${id}/status`, { status: 'cancelled', admin_notes: 'Cancelled by student' });
      fetchMyBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel reservation.');
    }
  };

  const startEditing = (reservation) => {
    const start = new Date(reservation.start_time);
    const end = new Date(reservation.end_time);
    setEditingReservation({
      id: reservation.id,
      startDate: localDate(start),
      startTime: localTime(start),
      endDate: localDate(end),
      endTime: localTime(end),
      purpose: reservation.purpose
    });
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    const start = new Date(`${editingReservation.startDate}T${editingReservation.startTime}`);
    const end = new Date(`${editingReservation.endDate}T${editingReservation.endTime}`);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      alert('Enter a valid start and end date/time.');
      return;
    }

    try {
      await api.patch(`/reservations/${editingReservation.id}`, {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        purpose: editingReservation.purpose
      });
      setEditingReservation(null);
      fetchMyBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update reservation.');
    }
  };

  const handleDelete = async (reservation) => {
    if (!window.confirm(`Permanently delete the ${reservation.status} reservation for ${reservation.equipment_name}?`)) return;

    try {
      await api.delete(`/reservations/${reservation.id}`);
      fetchMyBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete reservation.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Personal Dashboard</span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">My Reservations</h1>
          <p className="text-xs text-slate-500 mt-1">Manage active slot bookings and review reservation history.</p>
        </div>

        <button
          onClick={fetchMyBookings}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs shadow-2xs hover:bg-slate-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 font-medium text-xs">
          Loading your reservations...
        </div>
      ) : myReservations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No reservations placed yet</h3>
          <p className="text-xs text-slate-500">Visit the Equipment Catalog to schedule your lab time slots.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {myReservations.map(res => {
            const start = new Date(res.start_time);
            const end = new Date(res.end_time);
            const isCancelable = ['pending', 'approved'].includes(res.status);
            const isEditing = editingReservation?.id === res.id;

            return (
              <div key={res.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-900 text-base">{res.equipment_name}</h3>
                    <StatusBadge status={res.status} />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{res.lab_name} ({res.lab_code})</p>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-w-xl">
                    <span className="font-semibold text-slate-800">Purpose:</span> {res.purpose}
                  </p>
                </div>

                  {isEditing ? (
                    <form onSubmit={handleUpdate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                      <label className="text-xs font-semibold text-slate-600">
                        Start date
                        <input required type="date" value={editingReservation.startDate} onChange={(event) => setEditingReservation({ ...editingReservation, startDate: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        Start time
                        <input required type="time" value={editingReservation.startTime} onChange={(event) => setEditingReservation({ ...editingReservation, startTime: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        End date
                        <input required type="date" value={editingReservation.endDate} onChange={(event) => setEditingReservation({ ...editingReservation, endDate: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        End time
                        <input required type="time" value={editingReservation.endTime} onChange={(event) => setEditingReservation({ ...editingReservation, endTime: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
                      </label>
                      <label className="text-xs font-semibold text-slate-600 sm:col-span-2 lg:col-span-5">
                        Purpose
                        <textarea required rows={2} value={editingReservation.purpose} onChange={(event) => setEditingReservation({ ...editingReservation, purpose: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
                      </label>
                      <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
                        <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"><Check className="h-4 w-4" />Save changes</button>
                        <button type="button" onClick={() => setEditingReservation(null)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"><X className="h-4 w-4" />Discard</button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-2 rounded-xl font-mono text-xs font-semibold self-start">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        {start.toLocaleDateString()} | {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {res.status === 'pending' && (
                          <button onClick={() => startEditing(res)} className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100">
                            <Pencil className="h-3.5 w-3.5" />Edit
                          </button>
                        )}
                        {isCancelable && (
                          <button onClick={() => handleCancel(res.id)} className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100">
                            <XCircle className="w-3.5 h-3.5" />Cancel Booking
                          </button>
                        )}
                        {['cancelled', 'rejected', 'completed'].includes(res.status) && (
                          <button onClick={() => handleDelete(res)} className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200">
                            <Trash2 className="h-3.5 w-3.5" />Delete record
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
