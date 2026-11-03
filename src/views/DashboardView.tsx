import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Item, Claim, Handover } from '../types';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';
import { ItemCard } from '../components/ItemCard';
import {
  User,
  LayoutDashboard,
  Search,
  CheckCircle2,
  ShieldCheck,
  PackageCheck,
  Bookmark,
  Plus,
  Trash2,
  ExternalLink,
  MapPin,
  Calendar,
  KeyRound,
  Sparkles,
  Clock,
  Building,
  GraduationCap,
  Briefcase,
  Shield,
  Eye,
} from 'lucide-react';

interface DashboardViewProps {
  onSelectItem: (item: Item) => void;
  onOpenReportModal: (type: 'lost' | 'found') => void;
  onOpenHandoverModal: (handover: Handover) => void;
  onOpenAuthModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectItem,
  onOpenReportModal,
  onOpenHandoverModal,
  onOpenAuthModal,
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const {
    items,
    claims,
    handovers,
    savedItemIds,
    deleteItem,
    updateItemStatus,
  } = useData();

  const [activeTab, setActiveTab] = useState<
    'lost' | 'found' | 'my_claims' | 'incoming_claims' | 'handovers' | 'saved'
  >('lost');

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
        <User className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Sign in to Access Your Dashboard</h2>
        <p className="text-xs text-slate-500">
          Manage your reported items, track active ownership claims, and check safe handover pickup codes.
        </p>
        <button
          onClick={onOpenAuthModal}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  // Data subsets
  const myLostItems = items.filter(
    (i) => i.owner_id === currentUser.id && i.type === 'lost'
  );
  const myFoundItems = items.filter(
    (i) => i.owner_id === currentUser.id && i.type === 'found'
  );
  const mySubmittedClaims = claims.filter(
    (c) => c.claimant_id === currentUser.id
  );
  const incomingClaims = claims.filter((c) => {
    const item = items.find((i) => i.id === c.item_id);
    return item?.owner_id === currentUser.id;
  });
  const myHandovers = handovers.filter(
    (h) => h.claimant_id === currentUser.id || h.finder_id === currentUser.id
  );
  const savedItems = items.filter((i) => savedItemIds.includes(i.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Profile Overview Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={
                currentUser.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={currentUser.full_name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-2xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">{currentUser.full_name}</h1>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 capitalize">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{currentUser.email}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2 font-medium">
                {currentUser.student_staff_id && (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    ID: {currentUser.student_staff_id}
                  </span>
                )}
                {currentUser.department && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    {currentUser.department}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {currentUser.campus}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => onOpenReportModal('lost')}
              className="flex-1 md:flex-none px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs rounded-lg border border-orange-200 shadow-2xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              Report Lost
            </button>
            <button
              onClick={() => onOpenReportModal('found')}
              className="flex-1 md:flex-none px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 shadow-2xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Report Found
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-xs flex flex-wrap gap-1.5">
        {[
          { id: 'lost', label: 'My Lost Items', count: myLostItems.length, icon: Search },
          { id: 'found', label: 'My Found Items', count: myFoundItems.length, icon: CheckCircle2 },
          { id: 'my_claims', label: 'My Claims', count: mySubmittedClaims.length, icon: ShieldCheck },
          { id: 'incoming_claims', label: 'Incoming Claims', count: incomingClaims.length, icon: User },
          { id: 'handovers', label: 'Handovers & Pickups', count: myHandovers.length, icon: PackageCheck },
          { id: 'saved', label: 'Bookmarks', count: savedItems.length, icon: Bookmark },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. My Lost Items */}
      {activeTab === 'lost' && (
        <div className="space-y-4">
          {myLostItems.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <Search className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Lost Items Reported</h3>
              <p className="text-xs text-slate-500">Misplaced something on campus? File a report to alert finders and security.</p>
              <button
                onClick={() => onOpenReportModal('lost')}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Report Lost Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myLostItems.map((item) => (
                <div key={item.id} className="relative group">
                  <ItemCard item={item} onSelect={onSelectItem} />
                  <div className="p-3 bg-slate-50 border-x border-b border-slate-200 rounded-b-xl -mt-2 flex items-center justify-between text-xs">
                    <button
                      onClick={() => updateItemStatus(item.id, 'recovered')}
                      className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Mark Recovered
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-orange-600 font-medium hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. My Found Items */}
      {activeTab === 'found' && (
        <div className="space-y-4">
          {myFoundItems.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Found Items Reported</h3>
              <p className="text-xs text-slate-500">Found something on campus? Help return it to its owner.</p>
              <button
                onClick={() => onOpenReportModal('found')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Report Found Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myFoundItems.map((item) => (
                <div key={item.id} className="relative group">
                  <ItemCard item={item} onSelect={onSelectItem} />
                  <div className="p-3 bg-slate-50 border-x border-b border-slate-200 rounded-b-xl -mt-2 flex items-center justify-between text-xs">
                    <button
                      onClick={() => updateItemStatus(item.id, 'recovered')}
                      className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Mark Returned
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-orange-600 font-medium hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. My Submitted Claims */}
      {activeTab === 'my_claims' && (
        <div className="space-y-3">
          {mySubmittedClaims.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Claims Submitted</h3>
              <p className="text-xs text-slate-500">When you claim a found item, you can track officer verification status here.</p>
            </div>
          ) : (
            mySubmittedClaims.map((claim) => {
              const matchedHandover = handovers.find((h) => h.claim_id === claim.id);
              return (
                <div
                  key={claim.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">
                        Claim for Item #{claim.item_id.slice(-6)}
                      </span>
                      <StatusBadge status={claim.status} />
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong>Submitted Proof: </strong>
                      {claim.verification_details}
                    </p>
                    {claim.reviewer_notes && (
                      <div className="p-2.5 bg-indigo-50 rounded-lg text-xs text-indigo-900 border border-indigo-200/60">
                        <strong>Campus Officer Feedback: </strong>
                        {claim.reviewer_notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {matchedHandover && (
                      <button
                        onClick={() => onOpenHandoverModal(matchedHandover)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                        View Pickup PIN
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. Incoming Claims on My Found Items */}
      {activeTab === 'incoming_claims' && (
        <div className="space-y-3">
          {incomingClaims.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <User className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Incoming Claims</h3>
              <p className="text-xs text-slate-500">No ownership claims submitted yet for items you found.</p>
            </div>
          ) : (
            incomingClaims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">
                      Claimant: {claim.claimant_name} ({claim.claimant_type})
                    </span>
                    <StatusBadge status={claim.status} />
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(claim.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Verification details provided: </strong>
                  {claim.verification_details}
                </p>
                <div className="text-[11px] text-slate-500">
                  Campus moderators and security review these claims before scheduling physical handover.
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 5. Scheduled Handovers */}
      {activeTab === 'handovers' && (
        <div className="space-y-3">
          {myHandovers.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <PackageCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Scheduled Handovers</h3>
              <p className="text-xs text-slate-500">Once an ownership claim is verified, safe handover pickup instructions appear here.</p>
            </div>
          ) : (
            myHandovers.map((h) => (
              <div
                key={h.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-800">{h.item_title}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        h.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {h.status === 'completed' ? 'Completed' : 'Ready for Pickup'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    <strong>Location: </strong> {h.handover_location}
                  </div>
                </div>

                <button
                  onClick={() => onOpenHandoverModal(h)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                  View Secret PIN ({h.verification_pin})
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* 6. Bookmarked Saved Items */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedItems.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Saved Items</h3>
              <p className="text-xs text-slate-500">Click the bookmark icon on any item in Browse to pin it for quick tracking.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedItems.map((item) => (
                <ItemCard key={item.id} item={item} onSelect={onSelectItem} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
