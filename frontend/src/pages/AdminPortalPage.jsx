import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { ShieldCheck, Activity, Clock, Wrench, Check, X, RefreshCw, Plus, AlertOctagon, RotateCcw } from 'lucide-react';

export default function AdminPortalPage() {
  const [analytics, setAnalytics] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('approvals'); // approvals | equipment | analytics

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/analytics'),
      api.get('/reservations'),
      api.get('/equipment')
    ]).then(([analyticsRes, resRes, eqRes]) => {
      setAnalytics(analyticsRes.data);
      setReservations(resRes.data.reservations);
      setEquipmentList(eqRes.data.equipment);
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateReservation = async (id, status) => {
    const notes = prompt(`Enter technician notes for marking status as ${status}:`, status === 'approved' ? 'Approved by lab supervisor' : 'Rejected due to lab conflict');
    if (notes === null) return;

    try {
      await api.patch(`/reservations/${id}/status`, { status, admin_notes: notes });
      loadData();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleEquipmentStatusChange = async (eqId, newStatus) => {
    let issue = '';
    if (newStatus === 'maintenance') {
      issue = prompt('Describe maintenance issue / reason:') || 'Scheduled calibration';
    }

    try {
      await api.patch(`/equipment/${eqId}/status`, { status: newStatus, issue_description: issue });
      loadData();
    } catch (err) {
      alert('Failed to update equipment status.');
    }
  };

  const handleReseedDb = async () => {
    if (!window.confirm('Reset database to initial sample records?')) return;
    try {
      await api.post('/seed');
      loadData();
      alert('Database successfully re-seeded!');
    } catch (err) {
      alert('Failed to reseed database.');
    }
  };

  const pendingReservations = reservations.filter(r => r.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-md">
            Supervisor & Admin Portal
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Lab Management Console</h1>
          <p className="text-xs text-slate-500 mt-1">Review pending booking requests, manage lab equipment, and monitor utilization.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReseedDb}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs hover:bg-amber-100 transition"
            title="Reset sample records"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Sample Data
          </button>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs shadow-2xs hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Utilization Rate</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {analytics.summary.utilizationRate}%
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Pending Approvals</span>
              <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
                {analytics.summary.pendingApprovals}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Equipment In Maintenance</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {analytics.summary.underMaintenance}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Total Registered Assets</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {analytics.summary.totalEquipment}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 border-b-2 flex items-center gap-2 ${activeTab === 'approvals' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Approval Queue
          {pendingReservations.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
              {pendingReservations.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`pb-3 border-b-2 flex items-center gap-2 ${activeTab === 'equipment' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Equipment Inventory Control
        </button>
      </div>

      {/* Tab 1: Approval Queue */}
      {activeTab === 'approvals' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 font-bold text-slate-900 text-sm">
            Pending Reservation Requests requiring Supervisor Authorization
          </div>
          {pendingReservations.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 font-medium">
              🎉 No pending requests in queue!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingReservations.map(res => (
                <div key={res.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{res.equipment_name}</h4>
                      <StatusBadge status={res.status} />
                    </div>
                    <p className="text-xs text-slate-500">
                      Requested by: <span className="font-semibold text-slate-700">{res.user_name}</span> ({res.user_email})
                    </p>
                    <p className="text-xs text-slate-600 bg-slate-100 p-2.5 rounded-xl">
                      Purpose: {res.purpose}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleUpdateReservation(res.id, 'approved')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateReservation(res.id, 'rejected')}
                      className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-xs flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Equipment Inventory Control */}
      {activeTab === 'equipment' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 font-bold text-slate-900 text-sm">
            Lab Machinery Status & Maintenance Controls
          </div>
          <div className="divide-y divide-slate-100">
            {equipmentList.map(item => (
              <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">S/N: {item.serial_number} | Lab: {item.lab_name}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold mr-1">Set Status:</span>
                  <button
                    onClick={() => handleEquipmentStatusChange(item.id, 'available')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${item.status === 'available' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Available
                  </button>
                  <button
                    onClick={() => handleEquipmentStatusChange(item.id, 'maintenance')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${item.status === 'maintenance' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Maintenance
                  </button>
                  <button
                    onClick={() => handleEquipmentStatusChange(item.id, 'out_of_order')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${item.status === 'out_of_order' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Out of Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
