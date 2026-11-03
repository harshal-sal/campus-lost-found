import React from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Item, ItemMatch } from '../types';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  HelpCircle,
  Eye,
  X,
  AlertCircle,
  Check,
} from 'lucide-react';

interface MatchesViewProps {
  onSelectItem: (item: Item) => void;
  onOpenClaim: (item: Item) => void;
  onNavigate: (view: string) => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({
  onSelectItem,
  onOpenClaim,
  onNavigate,
}) => {
  const { matches, items, dismissMatch } = useData();
  const { currentUser } = useAuth();

  // Filter matches related to current user if available, else show all campus matches
  const activeMatches = matches.filter((m) => m.status === 'potential');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Automated Campus Matching Engine
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
              Potential Item Matches & Pairings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Our rule-based algorithmic matching engine cross-references category tags, text keyword tokens, campus building locations, and incident dates to suggest high-probability matches.
            </p>
          </div>

          <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs text-center shrink-0">
            <div className="text-2xl font-bold text-indigo-600">{activeMatches.length}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Matches</div>
          </div>
        </div>
      </div>

      {/* Matches List */}
      {activeMatches.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No New Potential Matches</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When someone reports a found item matching your lost report (or vice versa), it will appear here automatically.
          </p>
          <button
            onClick={() => onNavigate('browse')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
          >
            Browse All Listings
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {activeMatches.map((match) => {
            const lostItem = items.find((i) => i.id === match.lost_item_id) || match.lost_item;
            const foundItem = items.find((i) => i.id === match.found_item_id) || match.found_item;

            if (!lostItem || !foundItem) return null;

            const isUserLostOwner = currentUser?.id === lostItem.owner_id;

            return (
              <div
                key={match.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 overflow-hidden transition-all"
              >
                {/* Score & Reasons Header */}
                <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded shadow-2xs flex items-center gap-1.5 ${
                        match.confidence === 'high'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {match.similarity_score}% Match ({match.confidence.toUpperCase()})
                    </span>

                    <span className="text-xs text-slate-500 font-medium">
                      Matched on {new Date(match.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => dismissMatch(match.id)}
                      className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                      Dismiss
                    </button>
                  </div>
                </div>

                {/* Match Reason Chips */}
                <div className="px-6 py-2.5 bg-indigo-50/40 border-b border-slate-100 flex flex-wrap gap-2 text-xs">
                  <span className="font-bold text-slate-700">Match Indicators:</span>
                  {match.match_reasons.map((reason, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-white border border-indigo-200 text-indigo-800 rounded font-medium text-[11px] flex items-center gap-1 shadow-2xs"
                    >
                      <Check className="w-3 h-3 text-indigo-600" />
                      {reason}
                    </span>
                  ))}
                </div>

                {/* Side-by-side comparison */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Lost Item */}
                  <div className="bg-orange-50/40 rounded-xl p-4 border border-orange-200/70 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-600 text-white">
                          LOST REPORT
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(lostItem.date_occurred).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <img
                          src={lostItem.image_url}
                          alt={lostItem.title}
                          referrerPolicy="no-referrer"
                          className="w-20 h-20 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{lostItem.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                            {lostItem.description}
                          </p>
                          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-orange-500" />
                            {lostItem.location_detail || 'Campus Area'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectItem(lostItem)}
                      className="w-full py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Inspect Lost Report
                    </button>
                  </div>

                  {/* Right: Found Item */}
                  <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-200/70 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white">
                          FOUND ITEM
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(foundItem.date_occurred).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <img
                          src={foundItem.image_url}
                          alt={foundItem.title}
                          referrerPolicy="no-referrer"
                          className="w-20 h-20 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{foundItem.title}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                            {foundItem.description}
                          </p>
                          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            {foundItem.current_holding_location || 'Campus Custody'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onSelectItem(foundItem)}
                        className="flex-1 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect Found Item
                      </button>

                      <button
                        onClick={() => onOpenClaim(foundItem)}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Claim Item
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
