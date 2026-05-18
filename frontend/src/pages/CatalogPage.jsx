import React, { useEffect, useState } from 'react';
import api from '../services/api';
import EquipmentCard from '../components/EquipmentCard';
import EquipmentDetailModal from '../components/EquipmentDetailModal';
import ReservationModal from '../components/ReservationModal';
import { Search, Filter, RefreshCw, Cpu, AlertCircle } from 'lucide-react';

export default function CatalogPage() {
  const [equipmentList, setEquipmentList] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLab, setSelectedLab] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [bookingEquipment, setBookingEquipment] = useState(null);

  const fetchEquipment = () => {
    setLoading(true);
    let url = `/equipment?`;
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (selectedCategory) url += `category=${encodeURIComponent(selectedCategory)}&`;
    if (selectedLab) url += `labId=${encodeURIComponent(selectedLab)}&`;
    if (selectedStatus) url += `status=${encodeURIComponent(selectedStatus)}&`;

    api.get(url)
      .then(res => setEquipmentList(res.data.equipment))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/labs').then(res => setLabs(res.data.labs)).catch(console.error);
    fetchEquipment();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchEquipment, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedLab, selectedStatus]);

  const categories = ['Oscilloscopes', 'Spectrum Analyzers', 'Rapid Prototyping', 'PCB Fabrication', 'AI & Embedded Computing', 'Power Electronics'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Equipment Catalog</span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Laboratory Equipment Inventory</h1>
          <p className="text-xs text-slate-500 mt-1">Browse, filter, and inspect specialized EE4207 lab machinery.</p>
        </div>

        <button
          onClick={fetchEquipment}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs shadow-2xs hover:bg-slate-50 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Inventory
        </button>
      </div>

      {/* Search & Filters Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by name, specs, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Lab Filter */}
          <select
            value={selectedLab}
            onChange={(e) => setSelectedLab(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Lab Rooms</option>
            {labs.map(lab => (
              <option key={lab.id} value={lab.id}>{lab.name} ({lab.code})</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="available">Available Only</option>
            <option value="maintenance">In Maintenance</option>
            <option value="out_of_order">Out of Order</option>
          </select>
        </div>
      </div>

      {/* Equipment Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 font-medium text-xs">
          Loading equipment inventory...
        </div>
      ) : equipmentList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No equipment found matching criteria</h3>
          <p className="text-xs text-slate-500">Try adjusting your search query or clear active filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipmentList.map(item => (
            <EquipmentCard
              key={item.id}
              equipment={item}
              onSelect={setSelectedEquipment}
              onReserve={setBookingEquipment}
            />
          ))}
        </div>
      )}

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
          onSuccess={fetchEquipment}
        />
      )}
    </div>
  );
}
