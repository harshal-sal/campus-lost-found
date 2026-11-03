import React, { useState } from 'react';
import { Item, Claim } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import {
  X,
  ShieldCheck,
  Lock,
  FileCheck,
  AlertCircle,
  Upload,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface ClaimModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (claim: Claim) => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  item,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { submitClaim } = useData();
  const { currentUser } = useAuth();

  const [verificationDetails, setVerificationDetails] = useState('');
  const [uniqueIdentifier, setUniqueIdentifier] = useState('');
  const [lostPlaceTime, setLostPlaceTime] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [claimantPhone, setClaimantPhone] = useState(currentUser?.phone || '');
  const [claimantIdNumber, setClaimantIdNumber] = useState(currentUser?.student_staff_id || '');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('You must be logged in to submit a claim.');
      return;
    }

    if (!verificationDetails.trim() || verificationDetails.length < 15) {
      setError('Please provide thorough verification details (at least 15 characters) so campus moderators can verify your ownership.');
      return;
    }

    if (!lostPlaceTime.trim()) {
      setError('Please describe approximately when and where you misplaced the item.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const res = await submitClaim({
      item_id: item.id,
      verification_details: verificationDetails.trim(),
      unique_identifier: uniqueIdentifier.trim(),
      lost_place_time: lostPlaceTime.trim(),
      proof_url: proofUrl.trim() || undefined,
      claimant_phone: claimantPhone.trim() || undefined,
      claimant_id_number: claimantIdNumber.trim() || undefined,
      additional_notes: additionalNotes.trim() || undefined,
    });

    setIsSubmitting(false);

    if (res.success && res.claim) {
      onSuccess(res.claim);
      onClose();
    } else {
      setError(res.error || 'Failed to submit claim. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Claim Ownership Verification
            </h2>
            <p className="text-xs text-slate-500">
              Item: <span className="font-semibold text-slate-700">{item.title}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Privacy Notice */}
        <div className="bg-indigo-950 text-indigo-100 p-4 text-xs flex items-start gap-3 border-b border-indigo-900">
          <Lock className="w-5 h-5 text-indigo-300 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-white">Strict Campus Privacy Notice: </span>
            Your responses below are strictly confidential and will NOT be shown publicly. They will only be cross-examined by authorized campus safety officers to ensure safe and legitimate item recovery.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-orange-50 border border-orange-200 text-orange-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Verification Details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detailed Distinguishing Features (That Only You Know) *
            </label>
            <textarea
              rows={3}
              value={verificationDetails}
              onChange={(e) => setVerificationDetails(e.target.value)}
              placeholder="e.g. Stickers (specify what kind and placement), scratches, lock screen wallpaper, engraving, specific contents inside pockets..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Provide specific details not mentioned in the public listing.
            </p>
          </div>

          {/* Serial / Unique ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Serial Number, Student/Staff ID, or Initials (Optional)
            </label>
            <input
              type="text"
              value={uniqueIdentifier}
              onChange={(e) => setUniqueIdentifier(e.target.value)}
              placeholder="e.g. Serial # C02G..., student ID stamped on card, engraved initials..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Place & Time Misplaced */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              When & Where Did You Misplace It? *
            </label>
            <input
              type="text"
              value={lostPlaceTime}
              onChange={(e) => setLostPlaceTime(e.target.value)}
              placeholder="e.g. August 16th around 5:30 PM near 3rd floor study carrels..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Proof Document URL / Receipt */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Proof Document / Purchase Receipt / Previous Photo URL (Optional)
            </label>
            <input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://... (Receipt, unboxing photo, warranty card)"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Claimant Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Contact Phone
              </label>
              <input
                type="tel"
                value={claimantPhone}
                onChange={(e) => setClaimantPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student / Staff ID Number
              </label>
              <input
                type="text"
                value={claimantIdNumber}
                onChange={(e) => setClaimantIdNumber(e.target.value)}
                placeholder="STU-2024-XXXX"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Additional Notes for Campus Officer
            </label>
            <input
              type="text"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Can bring original retail box and passport to the security desk..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                'Submitting Claim...'
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Submit Verified Claim
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
