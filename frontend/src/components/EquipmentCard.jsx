import React from 'react';
import StatusBadge from './StatusBadge';
import { getEquipmentImageUrl } from '../utils/equipmentImage';
import { MapPin, Clock, Shield, Info, Calendar } from 'lucide-react';

export default function EquipmentCard({ equipment, onSelect, onReserve }) {
  const isAvailable = equipment.status === 'available';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group">
      {/* Image & Status Badge */}
      <div className="relative h-44 bg-slate-100 overflow-hidden">
        <img
          src={getEquipmentImageUrl(equipment)}
          alt={equipment.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/equipment/lab-instrument.svg';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3">
          <StatusBadge status={equipment.status} />
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900/80 text-white backdrop-blur-md">
            {equipment.category}
          </span>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-1">
            {equipment.name}
          </h3>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{equipment.model}</p>

          {/* Specs preview */}
          <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
            {equipment.description || equipment.specs}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {equipment.lab_code || equipment.lab_name}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Max {equipment.max_hours_per_slot}h / slot
            </span>
            {equipment.requires_approval === 1 && (
              <span className="flex items-center gap-1 text-amber-600 font-medium" title="Supervisor approval required">
                <Shield className="w-3.5 h-3.5" />
                Approval Required
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={() => onSelect(equipment)}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition flex items-center justify-center gap-1"
          >
            <Info className="w-3.5 h-3.5" />
            Specs & Details
          </button>
          <button
            disabled={!isAvailable}
            onClick={() => onReserve(equipment)}
            className={`flex-1 py-2 px-3 rounded-xl font-semibold text-xs shadow-xs transition flex items-center justify-center gap-1 ${
              isAvailable
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/10'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Reserve Slot
          </button>
        </div>
      </div>
    </div>
  );
}
