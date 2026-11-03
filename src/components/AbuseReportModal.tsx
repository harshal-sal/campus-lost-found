import React, { useState } from 'react';
import { Item, ReportAbuse } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import {
  X,
  Flag,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface AbuseReportModalProps {
  item: Item | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AbuseReportModal: React.FC<AbuseReportModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const { reportAbuse } = useData();
  const { currentUser } = useAuth();

  const [reason, setReason] = useState<ReportAbuse['reason']>('fraudulent_listing');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    await reportAbuse({
      item_id: item.id,
      item_title: item.title,
      reason,
      description: description.trim() || 'No additional details provided.',
    });
    setIsSubmitting(false);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-orange-600" />
            <h2 className="text-base font-bold text-slate-800">Report Listing</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Report Received</h3>
            <p className="text-xs text-slate-600">
              Campus moderators will review this listing shortly. Thank you for keeping our campus safe!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-xs text-slate-600">
              Reporting: <span className="font-semibold text-slate-800">{item.title}</span>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Reason for Reporting:
              </label>
              <div className="space-y-2 text-xs">
                {[
                  { id: 'fraudulent_listing', label: 'Suspicious or Fraudulent Listing' },
                  { id: 'spam', label: 'Spam, Advertising, or Irrelevant Content' },
                  { id: 'wrong_information', label: 'Inaccurate or Misleading Information' },
                  { id: 'duplicate', label: 'Duplicate Listing' },
                  { id: 'inappropriate_content', label: 'Inappropriate or Offensive Material' },
                ].map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      reason === option.id
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-medium'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_reason"
                      checked={reason === option.id}
                      onChange={() => setReason(option.id as ReportAbuse['reason'])}
                      className="text-indigo-600"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain why you are flagging this item..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg shadow-xs"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
