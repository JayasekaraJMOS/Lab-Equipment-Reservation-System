import React from 'react';
import StatusBadge from './StatusBadge';
import { getEquipmentImageUrl } from '../utils/equipmentImage';
import { X, MapPin, Clock, ShieldAlert, Cpu, FileText, CheckCircle2 } from 'lucide-react';

export default function EquipmentDetailModal({ equipment, onClose, onReserve }) {
  if (!equipment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700">
                {equipment.category}
              </span>
              <StatusBadge status={equipment.status} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-2">{equipment.name}</h2>
            <p className="text-xs text-slate-500 font-mono">Model: {equipment.model} | S/N: {equipment.serial_number}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 space-y-5 text-sm">
          {/* Image */}
          <div className="h-56 rounded-2xl bg-slate-100 overflow-hidden">
            <img
              src={getEquipmentImageUrl(equipment)}
              alt={equipment.name}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/equipment/lab-instrument.svg';
              }}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Location & Guidelines */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-400 font-semibold block uppercase">Lab Location</span>
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4 text-blue-600" />
                {equipment.lab_name}
              </span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-400 font-semibold block uppercase">Max Duration</span>
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1 mt-1">
                <Clock className="w-4 h-4 text-blue-600" />
                {equipment.max_hours_per_slot} Hours / Session
              </span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-400 font-semibold block uppercase">Approval Type</span>
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1 mt-1">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                {equipment.requires_approval ? 'Supervisor Review' : 'Auto Approval'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-600" />
              Equipment Overview & Description
            </h4>
            <p className="text-slate-600 text-xs leading-relaxed bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
              {equipment.description || 'No detailed description available.'}
            </p>
          </div>

          {/* Specifications */}
          {equipment.specs && (
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Technical Specifications
              </h4>
              <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs leading-relaxed overflow-x-auto shadow-inner">
                {equipment.specs}
              </div>
            </div>
          )}

          {/* Safety & Operating Rules */}
          <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl text-xs text-amber-900">
            <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              Safety & Operating Guidelines:
            </p>
            <ul className="list-disc list-inside space-y-1 text-amber-800 font-normal">
              <li>Always perform visual inspection before powering on high-voltage components.</li>
              <li>Clean workspace and log off equipment session 5 minutes prior to slot end time.</li>
              <li>Enforced 15-minute calibration buffer between consecutive user reservations.</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-100"
          >
            Close
          </button>
          <button
            disabled={equipment.status !== 'available'}
            onClick={() => {
              onClose();
              onReserve(equipment);
            }}
            className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition ${
              equipment.status === 'available'
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {equipment.status === 'available' ? 'Proceed to Reservation' : 'Currently Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
}
