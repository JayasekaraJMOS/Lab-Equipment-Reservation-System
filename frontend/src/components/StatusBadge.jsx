import React from 'react';
import { CheckCircle2, Clock, Wrench, AlertOctagon, XCircle, ShieldCheck } from 'lucide-react';

export default function StatusBadge({ status }) {
  const configs = {
    available: { label: 'Available', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', Icon: CheckCircle2 },
    approved: { label: 'Approved', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', Icon: ShieldCheck },
    pending: { label: 'Pending Approval', bg: 'bg-amber-100 text-amber-800 border-amber-300', Icon: Clock },
    maintenance: { label: 'In Maintenance', bg: 'bg-amber-100 text-amber-800 border-amber-300', Icon: Wrench },
    out_of_order: { label: 'Out of Order', bg: 'bg-rose-100 text-rose-800 border-rose-300', Icon: AlertOctagon },
    rejected: { label: 'Rejected', bg: 'bg-rose-100 text-rose-800 border-rose-300', Icon: XCircle },
    cancelled: { label: 'Cancelled', bg: 'bg-slate-100 text-slate-600 border-slate-300', Icon: XCircle },
    completed: { label: 'Completed', bg: 'bg-blue-100 text-blue-800 border-blue-300', Icon: CheckCircle2 }
  };

  const config = configs[status] || { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-300', Icon: Clock };
  const { label, bg, Icon } = config;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${bg}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}
