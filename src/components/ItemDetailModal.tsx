import React, { useState } from 'react';
import { Item, ItemStatus } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { TypeBadge, StatusBadge } from './StatusBadge';
import { CategoryIcon } from './CategoryIcon';
import {
  X,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  Sparkles,
  Gift,
  Bookmark,
  Share2,
  AlertTriangle,
  ArrowRight,
  Lock,
  UserCheck,
  Building,
  CheckCircle2,
  Layers,
  Flag,
  FileCheck,
  Eye,
} from 'lucide-react';

interface ItemDetailModalProps {
  item: Item | null;
  isOpen?: boolean;
  onClose: () => void;
  onOpenClaim: (item: Item) => void;
  onOpenReportAbuse: (item: Item) => void;
  onSelectMatchedItem?: (item: Item) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onOpenClaim,
  onOpenReportAbuse,
  onSelectMatchedItem,
}) => {
  const { categories, locations, getItemMatches, isItemSaved, toggleSaveItem, adminModerateItem } = useData();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'matches'>('details');
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  const category = categories.find((c) => c.id === item.category_id);
  const location = locations.find((l) => l.id === item.location_id);
  const isSaved = isItemSaved(item.id);
  const matches = getItemMatches(item.id);

  const formattedDate = new Date(item.date_occurred).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isOwner = currentUser?.id === item.owner_id;
  const isStaffOrAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'moderator' ||
    currentUser?.role === 'faculty' ||
    currentUser?.role === 'staff';

  const canClaim =
    !isOwner &&
    item.status !== 'recovered' &&
    item.status !== 'closed' &&
    item.status !== 'rejected';

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Lifecycle steps calculation
  const getLifecycleStep = (status: ItemStatus) => {
    switch (status) {
      case 'lost':
      case 'found':
        return 1;
      case 'claim_pending':
        return 2;
      case 'claim_approved':
      case 'handover_pending':
        return 3;
      case 'recovered':
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getLifecycleStep(item.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <TypeBadge type={item.type} size="md" />
            <StatusBadge status={item.status} size="md" />
            {item.reward_info && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded border border-amber-200">
                <Gift className="w-3.5 h-3.5 text-amber-600" />
                Reward Offered
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSaveItem(item.id)}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isSaved
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-indigo-600 text-indigo-600' : ''}`} />
              <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">{copied ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Tracker Bar */}
        <div className="bg-slate-900 text-white px-6 py-3 border-b border-slate-800">
          <div className="flex items-center justify-between text-xs max-w-2xl mx-auto">
            <div className={`flex items-center gap-1.5 ${currentStep >= 1 ? 'text-indigo-400 font-semibold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800'}`}>1</span>
              <span>Reported</span>
            </div>
            <div className={`h-0.5 flex-1 mx-2 ${currentStep >= 2 ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
            <div className={`flex items-center gap-1.5 ${currentStep >= 2 ? 'text-indigo-400 font-semibold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-800'}`}>2</span>
              <span>Claim Review</span>
            </div>
            <div className={`h-0.5 flex-1 mx-2 ${currentStep >= 3 ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
            <div className={`flex items-center gap-1.5 ${currentStep >= 3 ? 'text-indigo-400 font-semibold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-800'}`}>3</span>
              <span>Safe Handover</span>
            </div>
            <div className={`h-0.5 flex-1 mx-2 ${currentStep >= 4 ? 'bg-emerald-400 font-semibold' : 'bg-slate-700'}`}></div>
            <div className={`flex items-center gap-1.5 ${currentStep >= 4 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep >= 4 ? 'bg-emerald-500 text-white' : 'bg-slate-800'}`}>4</span>
              <span>Recovered</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[75vh] overflow-y-auto">
          {/* Left Column: Image & Location Summary */}
          <div className="md:col-span-5 bg-slate-50 p-6 border-r border-slate-200 flex flex-col justify-between">
            <div>
              <div className="rounded-xl overflow-hidden shadow-xs border border-slate-200 aspect-4/3 bg-slate-200 mb-4 relative">
                <img
                  src={item.image_url}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Location Details Box */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-indigo-600" />
                  Campus Location Info
                </h4>

                <div className="text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-800">{location?.name}</div>
                      <div className="text-slate-500">{location?.building}</div>
                    </div>
                  </div>

                  {item.location_detail && (
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-700">
                      <span className="font-semibold text-slate-800">Specific spot: </span>
                      {item.location_detail}
                    </div>
                  )}

                  {item.current_holding_location && (
                    <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 font-medium flex items-start gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Current Custody: </span>
                        {item.current_holding_location}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reporter Meta */}
            <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                Reported by {isOwner ? 'You' : item.owner_name}
              </span>
              <span>{new Date(item.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Right Column: Information & Actions */}
          <div className="md:col-span-7 p-6 flex flex-col justify-between">
            <div>
              {/* Tab navigation */}
              <div className="flex items-center gap-4 border-b border-slate-200 pb-2 mb-4">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`text-sm font-bold pb-2 -mb-2.5 transition-colors ${
                    activeTab === 'details'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Item Details
                </button>
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`text-sm font-bold pb-2 -mb-2.5 flex items-center gap-1.5 transition-colors ${
                    activeTab === 'matches'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Potential Matches
                  <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                    {matches.length}
                  </span>
                </button>
              </div>

              {activeTab === 'details' ? (
                <div className="space-y-4">
                  {/* Title & Category */}
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
                      <CategoryIcon name={category?.icon || 'HelpCircle'} className="w-4 h-4" />
                      {category?.name}
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 leading-snug">{item.title}</h2>
                  </div>

                  {/* Date & Time Bar */}
                  <div className="flex flex-wrap gap-4 py-2.5 px-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      <span>{formattedDate}</span>
                    </div>
                    {item.approximate_time && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span>Approx: {item.approximate_time}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Description</h4>
                    <p className="text-sm text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                      {item.description}
                    </p>
                  </div>

                  {/* Public Distinguishing Features */}
                  {item.distinguishing_features && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                        Visible Distinguishing Features
                      </h4>
                      <p className="text-sm text-slate-700 bg-amber-50/50 p-3 rounded-lg border border-amber-200/60 leading-relaxed">
                        {item.distinguishing_features}
                      </p>
                    </div>
                  )}

                  {/* Reward Box */}
                  {item.reward_info && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                      <Gift className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold">Finder's Reward: </span>
                        {item.reward_info}
                      </div>
                    </div>
                  )}

                  {/* Security & Privacy Notice */}
                  <div className="p-3.5 bg-indigo-50/70 rounded-lg border border-indigo-200/80 text-xs text-indigo-900 flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Campus Privacy & Safety Protocol: </span>
                      Personal phone numbers and private serial numbers are never displayed publicly. To reclaim this item, submit a verified claim answering questions only the real owner would know.
                    </div>
                  </div>
                </div>
              ) : (
                /* Matches Tab */
                <div className="space-y-3">
                  <div className="text-xs text-slate-600 mb-2">
                    Our campus matching engine analyzes item categories, keywords, location proximity, and timestamps to suggest potential matches.
                  </div>

                  {matches.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
                      <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-slate-700">No Potential Matches Yet</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                        We will notify you automatically as soon as a matching item is reported on campus.
                      </p>
                    </div>
                  ) : (
                    matches.map((m) => {
                      const oppositeItem = item.type === 'lost' ? m.found_item : m.lost_item;
                      if (!oppositeItem) return null;

                      return (
                        <div
                          key={m.id}
                          className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow-2xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={oppositeItem.image_url}
                              alt={oppositeItem.title}
                              referrerPolicy="no-referrer"
                              className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    m.confidence === 'high'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {m.similarity_score}% Match ({m.confidence.toUpperCase()})
                                </span>
                                <span className="text-xs text-slate-500">
                                  {new Date(oppositeItem.date_occurred).toLocaleDateString()}
                                </span>
                              </div>
                              <h5 className="font-semibold text-slate-800 text-sm">{oppositeItem.title}</h5>
                              <p className="text-xs text-slate-500 line-clamp-1">{m.match_reasons.join(' • ')}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              onClose();
                              if (onSelectMatchedItem) {
                                onSelectMatchedItem(oppositeItem);
                              }
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 flex items-center gap-1 shrink-0"
                          >
                            View Item
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-5 mt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => onOpenReportAbuse(item)}
                className="text-xs text-slate-500 hover:text-orange-600 flex items-center gap-1 font-medium transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
                Report Suspicious Listing
              </button>

              <div className="flex items-center gap-2">
                {canClaim && (
                  <button
                    id="btn-claim-item"
                    onClick={() => {
                      onClose();
                      onOpenClaim(item);
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg shadow-xs hover:shadow-md transition-all flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Claim This Item
                  </button>
                )}

                {isOwner && (
                  <button
                    onClick={() => {
                      adminModerateItem(item.id, 'close');
                      onClose();
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors"
                  >
                    Mark as Resolved / Close
                  </button>
                )}

                {isStaffOrAdmin && (
                  <button
                    onClick={() => {
                      adminModerateItem(item.id, 'delete');
                      onClose();
                    }}
                    className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold text-xs rounded-lg border border-orange-200 transition-colors"
                  >
                    Delete Listing
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
