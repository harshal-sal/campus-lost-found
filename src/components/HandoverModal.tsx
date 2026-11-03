import React, { useState } from 'react';
import { Handover } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import {
  X,
  ShieldCheck,
  KeyRound,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building,
  UserCheck,
  Lock,
} from 'lucide-react';

interface HandoverModalProps {
  handover: Handover | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const HandoverModal: React.FC<HandoverModalProps> = ({
  handover,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { completeHandover } = useData();
  const { currentUser } = useAuth();
  const [pinInput, setPinInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [successCelebration, setSuccessCelebration] = useState(false);

  if (!isOpen || !handover) return null;

  const isClaimant = currentUser?.id === handover.claimant_id;
  const isOfficerOrAdmin =
    currentUser?.role === 'moderator' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'staff' ||
    currentUser?.role === 'faculty';

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setError('Please enter the 4-digit verification PIN.');
      return;
    }

    setIsVerifying(true);
    setError('');

    const res = await completeHandover(handover.id, pinInput.trim());
    setIsVerifying(false);

    if (res.success) {
      setSuccessCelebration(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500);
    } else {
      setError(res.error || 'Verification failed. Please check the PIN.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Safe Campus Handover & Recovery
            </h2>
            <p className="text-xs text-slate-500">
              Item: <span className="font-semibold text-slate-700">{handover.item_title}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successCelebration ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Handover Complete!</h3>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              The item has been officially verified and returned to its owner. Status updated to <span className="font-bold text-emerald-600">Recovered</span>!
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-orange-50 border border-orange-200 text-orange-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Handover Details Box */}
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Designated Safe Handover Point</div>
                  <div className="text-slate-600">{handover.handover_location}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <span className="font-semibold text-slate-500">Claimant:</span>
                  <div className="font-bold text-slate-800">{handover.claimant_name}</div>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Finder/Custody:</span>
                  <div className="font-bold text-slate-800">{handover.finder_name}</div>
                </div>
              </div>

              {handover.notes && (
                <div className="p-2.5 bg-indigo-50/80 rounded-md text-indigo-900 border border-indigo-200/60">
                  <span className="font-bold">Instructions: </span>
                  {handover.notes}
                </div>
              )}
            </div>

            {/* 4-Digit PIN Section */}
            <div className="bg-slate-900 text-white rounded-lg p-5 text-center shadow-xs space-y-2 border border-slate-800">
              <div className="flex items-center justify-center gap-1.5 text-xs text-indigo-400 font-bold uppercase tracking-wider">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Verification Secret PIN
              </div>
              <div className="text-3xl font-mono font-bold tracking-widest text-amber-300">
                {handover.verification_pin}
              </div>
              <p className="text-[11px] text-slate-300 max-w-xs mx-auto">
                {isClaimant
                  ? 'Present this 4-digit code to the campus safety officer at pickup to claim your item.'
                  : 'Claimant will provide this code at the desk to complete handover verification.'}
              </p>
            </div>

            {/* Verification Execution Form for Officers/Staff */}
            {handover.status !== 'completed' && (
              <form onSubmit={handleVerify} className="space-y-3 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700">
                  Security Officer PIN Verification
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter 4-digit PIN"
                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono tracking-widest text-center focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isVerifying ? 'Verifying...' : 'Confirm Handover'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  Entering the correct PIN marks the item as recovered and archives the case.
                </p>
              </form>
            )}

            {/* Close */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
