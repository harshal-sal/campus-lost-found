import React from 'react';
import { ItemStatus, ItemType, ClaimStatus } from '../types';
import {
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Sparkles,
  PackageCheck,
  Lock,
} from 'lucide-react';

interface StatusBadgeProps {
  status: ItemStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'lost':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 ${sizeClasses}`}
        >
          <Search className="w-3 h-3 text-rose-500" />
          Active Lost
        </span>
      );
    case 'found':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          Available Found
        </span>
      );
    case 'claim_pending':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 ${sizeClasses}`}
        >
          <Clock className="w-3 h-3 text-amber-500" />
          Claim Under Review
        </span>
      );
    case 'claim_approved':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 ${sizeClasses}`}
        >
          <ShieldCheck className="w-3 h-3 text-blue-500" />
          Ownership Verified
        </span>
      );
    case 'handover_pending':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 ${sizeClasses}`}
        >
          <PackageCheck className="w-3 h-3 text-indigo-500" />
          Ready for Pickup
        </span>
      );
    case 'recovered':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-full bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 ${sizeClasses}`}
        >
          <Sparkles className="w-3 h-3 text-teal-500" />
          Safely Recovered
        </span>
      );
    case 'pending_review':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800 ${sizeClasses}`}
        >
          <Clock className="w-3 h-3 text-yellow-500" />
          Pending Review
        </span>
      );
    case 'closed':
    case 'rejected':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 ${sizeClasses}`}
        >
          <XCircle className="w-3 h-3 text-slate-400" />
          {status === 'rejected' ? 'Rejected' : 'Closed'}
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}
        >
          {status}
        </span>
      );
  }
};

export const TypeBadge: React.FC<{ type: ItemType; size?: 'sm' | 'md' }> = ({ type, size = 'sm' }) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  if (type === 'lost') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded text-orange-600 bg-orange-50 border border-orange-200 shadow-2xs ${sizeClasses}`}
      >
        <Search className="w-3 h-3" />
        LOST
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider rounded text-emerald-600 bg-emerald-50 border border-emerald-200 shadow-2xs ${sizeClasses}`}
    >
      <CheckCircle2 className="w-3 h-3" />
      FOUND
    </span>
  );
};

export const ClaimStatusBadge: React.FC<{ status: ClaimStatus }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          Pending Review
        </span>
      );
    case 'under_review':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <Lock className="w-3.5 h-3.5 text-blue-500" />
          Under Review
        </span>
      );
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Approved & Verified
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-500" />
          Claim Declined
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {status}
        </span>
      );
  }
};
