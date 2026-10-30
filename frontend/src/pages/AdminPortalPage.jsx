import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { ShieldCheck, Activity, Clock, Wrench, Check, X, RefreshCw, Plus, AlertOctagon, RotateCcw, Database, FlaskConical } from 'lucide-react';

const EMPTY_EQ_FORM = {
  name: '', category: 'Oscilloscopes', model: '', serial_number: '',
  max_hours_per_slot: 4, requires_approval: true, description: '', specs: '', lab_id: ''
};

const EQ_CATEGORIES = [
  'Oscilloscopes', 'Power Supplies', 'Signal Generators', 'Spectrum Analyzers',
  '3D Printers', 'Microcontrollers', 'PCB Equipment', 'Test & Measurement', 'Other'
];

export default function AdminPortalPage() {
  const [analytics, setAnalytics] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('approvals'); // approvals | equipment | commission
  const [showAddModal, setShowAddModal] = useState(false);
  const [eqForm, setEqForm] = useState(EMPTY_EQ_FORM);
  const [eqFormError, setEqFormError] = useState('');
  const [eqFormLoading, setEqFormLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/analytics'),
      api.get('/reservations'),
      api.get('/equipment'),
      api.get('/labs')
    ]).then(([analyticsRes, resRes, eqRes, labsRes]) => {
      setAnalytics(analyticsRes.data);
      setReservations(resRes.data.reservations);
      setEquipmentList(eqRes.data.equipment);
      setLabs(labsRes.data.labs || []);
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

  const handleAddEquipment = async (e) => {
    e.preventDefault();
    setEqFormError('');
    if (!eqForm.lab_id) { setEqFormError('Please select a lab for this equipment.'); return; }
    setEqFormLoading(true);
    try {
      await api.post('/equipment', {
        ...eqForm,
        requires_approval: eqForm.requires_approval === true || eqForm.requires_approval === 'true',
        max_hours_per_slot: Number(eqForm.max_hours_per_slot)
      });
      setShowAddModal(false);
      setEqForm(EMPTY_EQ_FORM);
      loadData();
    } catch (err) {
      setEqFormError(err.response?.data?.error || 'Failed to commission new equipment.');
    } finally {
      setEqFormLoading(false);
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

      {/* Analytics Metric Cards – 5 MongoDB Collections */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Utilization</span>
            <span className="text-2xl font-extrabold text-slate-900">{analytics.summary.utilizationRate}%</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mt-auto">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Pending</span>
            <span className="text-2xl font-extrabold text-amber-600">{analytics.summary.pendingApprovals}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mt-auto">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Maintenance</span>
            <span className="text-2xl font-extrabold text-rose-600">{analytics.summary.underMaintenance}</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mt-auto">
              <Wrench className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Assets</span>
            <span className="text-2xl font-extrabold text-slate-900">{analytics.summary.totalEquipment}</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mt-auto">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Registered Users</span>
            <span className="text-2xl font-extrabold text-slate-900">{analytics.summary.totalUsers}</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mt-auto">
              <Database className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Maint. Logs</span>
            <span className="text-2xl font-extrabold text-slate-900">{analytics.summary.totalMaintenanceLogs ?? 0}</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mt-auto">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* 5 Collections Label */}
      {analytics && (
        <div className="flex items-center gap-2 -mt-4">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Real-time metrics aggregated across 5 MongoDB collections:
          </p>
          {['Users', 'Labs', 'Equipment', 'Reservations', 'Maintenance Logs'].map((col) => (
            <span key={col} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              {col}
            </span>
          ))}
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
        <button
          onClick={() => { setActiveTab('commission'); setShowAddModal(true); }}
          className={`pb-3 border-b-2 flex items-center gap-2 ${activeTab === 'commission' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Plus className="w-3.5 h-3.5" />
          Commission Hardware
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
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">Lab Machinery Status &amp; Maintenance Controls</span>
            <button
              onClick={() => { setShowAddModal(true); setActiveTab('commission'); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Commission New Hardware
            </button>
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

      {/* Recent Maintenance Logs (Equipment tab companion – shows MaintenanceLog collection data) */}
      {activeTab === 'equipment' && analytics?.recentMaintenanceLogs?.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-slate-900 text-sm">Recent Maintenance Log Entries</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 font-bold border border-orange-200">MaintenanceLogs Collection</span>
          </div>
          <div className="divide-y divide-slate-100">
            {analytics.recentMaintenanceLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/80">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900">{log.equipment}</p>
                  <p className="text-xs text-slate-500">
                    Issue: <span className="text-slate-700 font-medium">{log.issue}</span>
                  </p>
                  <p className="text-xs text-slate-400">Logged by: {log.technician}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${log.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {log.status === 'resolved' ? 'Resolved' : 'Under Repair'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commission New Hardware Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                  Admin Action
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">Commission New Laboratory Hardware</h2>
                <p className="text-xs text-slate-500 mt-0.5">Registers new equipment into the shared pool and makes it immediately bookable.</p>
              </div>
              <button onClick={() => { setShowAddModal(false); setEqForm(EMPTY_EQ_FORM); setEqFormError(''); setActiveTab('equipment'); }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {eqFormError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                ⚠ {eqFormError}
              </div>
            )}

            <form onSubmit={handleAddEquipment} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <label className="col-span-2 font-semibold text-slate-700">
                  Equipment Name *
                  <input required value={eqForm.name} onChange={e => setEqForm({...eqForm, name: e.target.value})}
                    placeholder="e.g., Keysight DSOX1204G Oscilloscope"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 font-normal" />
                </label>
                <label className="font-semibold text-slate-700">
                  Category *
                  <select required value={eqForm.category} onChange={e => setEqForm({...eqForm, category: e.target.value})}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 font-normal">
                    {EQ_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="font-semibold text-slate-700">
                  Model
                  <input value={eqForm.model} onChange={e => setEqForm({...eqForm, model: e.target.value})}
                    placeholder="e.g., DSOX1204G"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 font-normal" />
                </label>
                <label className="font-semibold text-slate-700">
                  Serial Number *
                  <input required value={eqForm.serial_number} onChange={e => setEqForm({...eqForm, serial_number: e.target.value})}
                    placeholder="e.g., SN-OSC-2024-009"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 font-normal" />
                </label>
                <label className="font-semibold text-slate-700">
                  Assign to Lab *
                  <select required value={eqForm.lab_id} onChange={e => setEqForm({...eqForm, lab_id: e.target.value})}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 font-normal">
                    <option value="">— Select Lab —</option>
                    {labs.map(l => <option key={l.id} value={l.id}>{l.name} ({l.code})</option>)}
                  </select>
                </label>
                <label className="font-semibold text-slate-700">
                  Max Hours / Slot
                  <select value={eqForm.max_hours_per_slot} onChange={e => setEqForm({...eqForm, max_hours_per_slot: Number(e.target.value)})}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 font-normal">
                    {[1,2,3,4,6,8].map(h => <option key={h} value={h}>{h} hour{h>1?'s':''}</option>)}
                  </select>
                </label>
                <label className="col-span-2 font-semibold text-slate-700">
                  Description
                  <textarea rows={2} value={eqForm.description}
                    onChange={e => setEqForm({...eqForm, description: e.target.value})}
                    placeholder="Brief description of the instrument's capabilities and usage."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 font-normal" />
                </label>
                <label className="col-span-2 flex items-center gap-2 font-semibold text-slate-700 cursor-pointer select-none">
                  <input type="checkbox" checked={eqForm.requires_approval}
                    onChange={e => setEqForm({...eqForm, requires_approval: e.target.checked})}
                    className="w-4 h-4 rounded accent-purple-600" />
                  Requires Supervisor Approval before use
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button"
                  onClick={() => { setShowAddModal(false); setEqForm(EMPTY_EQ_FORM); setEqFormError(''); setActiveTab('equipment'); }}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-100">
                  Cancel
                </button>
                <button type="submit" disabled={eqFormLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 shadow-md disabled:opacity-50">
                  <Plus className="w-3.5 h-3.5" />
                  {eqFormLoading ? 'Commissioning...' : 'Commission Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
