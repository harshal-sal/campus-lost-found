import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Item, ItemType, ItemStatus } from '../types';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';
import {
  FileText,
  Search,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Eye,
  Trash2,
  Printer,
  ChevronRight,
  Filter,
  Check,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Package,
  Layers,
  Building,
  QrCode,
  X,
  Share2,
  Lock,
} from 'lucide-react';

interface MyReportsViewProps {
  onSelectItem: (item: Item) => void;
  onOpenReportModal: (type: ItemType) => void;
  onNavigate: (view: string) => void;
  onOpenAuthModal: () => void;
}

export const MyReportsView: React.FC<MyReportsViewProps> = ({
  onSelectItem,
  onOpenReportModal,
  onNavigate,
  onOpenAuthModal,
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  const {
    items,
    claims,
    categories,
    locations,
    getItemMatches,
    deleteItem,
    updateItem,
  } = useData();

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'matched' | 'claimed' | 'recovered'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'views'>('newest');

  // Modal for printable flyer
  const [flyerItem, setFlyerItem] = useState<Item | null>(null);
  // Modal for item deletion confirmation
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);
  // Status update confirmation notice
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="max-w-xl mx-auto my-16 px-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto border border-indigo-200 shadow-2xs">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Sign in to Access My Reports</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-md mx-auto">
              Track the progress of your reported lost possessions, manage found items you've submitted to campus security, and review AI matching suggestions.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onOpenAuthModal}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors inline-flex items-center gap-2"
            >
              Sign In to View Reports
            </button>
          </div>
        </div>
      </div>
    );
  }

  // All reports belonging to the user
  const userItems = items.filter((i) => i.owner_id === currentUser.id);

  // Statistics calculation
  const totalReportsCount = userItems.length;
  const activeLostCount = userItems.filter((i) => i.type === 'lost' && i.status === 'lost').length;
  const activeFoundCount = userItems.filter((i) => i.type === 'found' && i.status === 'found').length;
  const recoveredCount = userItems.filter((i) => i.status === 'recovered' || i.status === 'closed').length;
  
  // Total potential matches on user's reports
  const totalMatchesCount = userItems.reduce((acc, item) => {
    return acc + getItemMatches(item.id).length;
  }, 0);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return userItems
      .filter((item) => {
        // Type filter
        if (typeFilter !== 'all' && item.type !== typeFilter) return false;

        // Status filter
        if (statusFilter === 'active') {
          if (item.status === 'recovered' || item.status === 'closed') return false;
        } else if (statusFilter === 'recovered') {
          if (item.status !== 'recovered' && item.status !== 'closed') return false;
        } else if (statusFilter === 'matched') {
          if (getItemMatches(item.id).length === 0) return false;
        } else if (statusFilter === 'claimed') {
          const itemClaims = claims.filter((c) => c.item_id === item.id);
          if (itemClaims.length === 0) return false;
        }

        // Category filter
        if (categoryFilter !== 'all' && item.category_id !== categoryFilter) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchFeatures = item.distinguishing_features?.toLowerCase().includes(q);
          const locationObj = locations.find((l) => l.id === item.location_id);
          const matchLoc = locationObj?.name.toLowerCase().includes(q) || locationObj?.building.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchFeatures && !matchLoc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        } else if (sortBy === 'views') {
          return b.views_count - a.views_count;
        }
        return 0;
      });
  }, [userItems, typeFilter, statusFilter, categoryFilter, searchQuery, sortBy, claims, locations, getItemMatches]);

  const handleStatusChange = async (itemId: string, newStatus: ItemStatus) => {
    const success = await updateItem(itemId, { status: newStatus });
    if (success) {
      showNotice(`Report status updated to "${newStatus.replace('_', ' ')}"`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    const success = await deleteItem(deletingItem.id);
    if (success) {
      showNotice(`Report "${deletingItem.title}" has been deleted.`);
      setDeletingItem(null);
    }
  };

  const getCategoryName = (id: string) => {
    return categories.find((c) => c.id === id)?.name || 'General';
  };

  const getLocationName = (id: string) => {
    const loc = locations.find((l) => l.id === id);
    return loc ? `${loc.name} (${loc.building})` : 'Campus Grounds';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-20 right-4 z-50 p-4 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{actionNotice}</span>
        </div>
      )}

      {/* Page Header with Action Buttons */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 mb-1">
              <FileText className="w-3.5 h-3.5" />
              Report Management Hub
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              My Reports
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Monitor active searches, update item status, review AI matching recommendations, and download printable recovery flyers.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onOpenReportModal('lost')}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Report Lost Item
            </button>
            <button
              onClick={() => onOpenReportModal('found')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Report Found Item
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6 border-t border-slate-100 mt-6">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Reports</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{totalReportsCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">All time submissions</div>
          </div>

          <div className="p-3.5 bg-orange-50/60 border border-orange-200/80 rounded-lg">
            <div className="text-[11px] font-semibold text-orange-700 uppercase tracking-wider">Active Lost</div>
            <div className="text-2xl font-black text-orange-800 mt-1">{activeLostCount}</div>
            <div className="text-[10px] text-orange-600/80 mt-0.5">Under search on campus</div>
          </div>

          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-lg">
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Active Found</div>
            <div className="text-2xl font-black text-emerald-800 mt-1">{activeFoundCount}</div>
            <div className="text-[10px] text-emerald-600/80 mt-0.5">Awaiting owner claim</div>
          </div>

          <div className="p-3.5 bg-indigo-50/60 border border-indigo-200/80 rounded-lg">
            <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">AI Matches</div>
            <div className="text-2xl font-black text-indigo-800 mt-1">{totalMatchesCount}</div>
            <div className="text-[10px] text-indigo-600/80 mt-0.5">Automated suggestions</div>
          </div>

          <div className="p-3.5 bg-purple-50/60 border border-purple-200/80 rounded-lg col-span-2 sm:col-span-1">
            <div className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Recovered</div>
            <div className="text-2xl font-black text-purple-800 mt-1">{recoveredCount}</div>
            <div className="text-[10px] text-purple-600/80 mt-0.5">Safely resolved</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Search input & Sort */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across your reports by title, serial number, or building..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 flex-1 sm:flex-initial"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 flex-1 sm:flex-initial"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="views">Most Views</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filters:
          </div>

          <button
            onClick={() => {
              setTypeFilter('all');
              setStatusFilter('all');
            }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              typeFilter === 'all' && statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Reports ({userItems.length})
          </button>

          <button
            onClick={() => setTypeFilter(typeFilter === 'lost' ? 'all' : 'lost')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              typeFilter === 'lost'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
            }`}
          >
            Lost Only ({userItems.filter((i) => i.type === 'lost').length})
          </button>

          <button
            onClick={() => setTypeFilter(typeFilter === 'found' ? 'all' : 'found')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              typeFilter === 'found'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Found Only ({userItems.filter((i) => i.type === 'found').length})
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              statusFilter === 'active'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            Active Search ({userItems.filter((i) => i.status !== 'recovered' && i.status !== 'closed').length})
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'matched' ? 'all' : 'matched')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              statusFilter === 'matched'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Has Matches ({userItems.filter((i) => getItemMatches(i.id).length > 0).length})
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'recovered' ? 'all' : 'recovered')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              statusFilter === 'recovered'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            Recovered / Closed ({recoveredCount})
          </button>
        </div>
      </div>

      {/* Reports List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No Reports Matching Your Filter</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or clear the filters above.'
                : 'You have not submitted any lost or found reports yet.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => onOpenReportModal('lost')}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg shadow-xs"
            >
              + Report Lost Item
            </button>
            <button
              onClick={() => onOpenReportModal('found')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs"
            >
              + Report Found Item
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const itemMatches = getItemMatches(item.id);
            const itemClaims = claims.filter((c) => c.item_id === item.id);
            const isResolved = item.status === 'recovered' || item.status === 'closed';

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-5 shadow-xs transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-start gap-4">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-20 h-20 rounded-lg object-cover border border-slate-200 bg-slate-50 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <TypeBadge type={item.type} />
                        <StatusBadge status={item.status} />
                        <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {getCategoryName(item.category_id)}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> {item.views_count} views
                        </span>
                      </div>

                      <h3
                        onClick={() => onSelectItem(item)}
                        className="text-base font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-1 max-w-xl">
                        {item.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {getLocationName(item.location_id)}
                          {item.location_detail ? ` (${item.location_detail})` : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(item.date_occurred).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Controls */}
                  <div className="flex flex-wrap sm:flex-col items-end gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      onClick={() => onSelectItem(item)}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </button>

                    <button
                      onClick={() => setFlyerItem(item)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      Print Notice / Flyer
                    </button>

                    <button
                      onClick={() => setDeletingItem(item)}
                      className="px-3.5 py-1.5 hover:bg-rose-50 text-rose-600 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Report
                    </button>
                  </div>
                </div>

                {/* Sub-Banner: Matches & Claims Alerts */}
                {(itemMatches.length > 0 || itemClaims.length > 0 || !isResolved) && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                    {/* Left Alert details */}
                    <div className="flex flex-wrap items-center gap-3">
                      {itemMatches.length > 0 && (
                        <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-semibold">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>{itemMatches.length} Potential AI Match{itemMatches.length > 1 ? 'es' : ''} Found</span>
                        </div>
                      )}

                      {itemClaims.length > 0 && (
                        <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{itemClaims.length} Ownership Claim{itemClaims.length > 1 ? 's' : ''} Filed</span>
                        </div>
                      )}

                      {item.secret_verification_key && (
                        <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" /> Security key registered
                        </span>
                      )}
                    </div>

                    {/* Right Quick Status Update */}
                    <div className="flex items-center gap-2">
                      {itemMatches.length > 0 && (
                        <button
                          onClick={() => onNavigate('matches')}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-md shadow-2xs transition-colors flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          Review Matches
                        </button>
                      )}

                      {!isResolved ? (
                        <button
                          onClick={() => handleStatusChange(item.id, 'recovered')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md shadow-2xs transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Mark as Recovered
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(item.id, item.type === 'lost' ? 'lost' : 'found')}
                          className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-md transition-colors"
                        >
                          Reopen Report
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Printable Poster / Notice Slip Modal */}
      {flyerItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Printable Campus Notice Flyer
                </h3>
              </div>
              <button
                onClick={() => setFlyerItem(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Notice Sheet Container */}
            <div className="p-6 space-y-4">
              <div
                id="printable-notice-card"
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 bg-slate-50/50 space-y-4 text-center font-sans"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="text-left">
                    <div className="text-[10px] font-bold tracking-wider uppercase text-indigo-600">
                      Official Campus Lost & Found Bulletin
                    </div>
                    <div className="text-xs font-semibold text-slate-500">
                      University Central Public Safety Network
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400">
                      REF #{flyerItem.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span
                    className={`inline-block px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider ${
                      flyerItem.type === 'lost'
                        ? 'bg-rose-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {flyerItem.type === 'lost' ? 'MISSING / LOST ITEM' : 'FOUND PROPERTY NOTICE'}
                  </span>
                  <h2 className="text-xl font-black text-slate-900 pt-1">
                    {flyerItem.title}
                  </h2>
                </div>

                <div className="w-44 h-44 mx-auto rounded-lg overflow-hidden border border-slate-200 bg-white">
                  <img
                    src={flyerItem.image_url}
                    alt={flyerItem.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-700">Category:</span>
                    <span className="text-slate-600">{getCategoryName(flyerItem.category_id)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-700">Campus Location:</span>
                    <span className="text-slate-600">{getLocationName(flyerItem.location_id)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-700">Date Logged:</span>
                    <span className="text-slate-600">{flyerItem.date_occurred}</span>
                  </div>
                  {flyerItem.reward_info && (
                    <div className="flex justify-between text-amber-700 font-bold bg-amber-50 p-1.5 rounded">
                      <span>Reward Offered:</span>
                      <span>{flyerItem.reward_info}</span>
                    </div>
                  )}
                  <p className="text-slate-600 pt-1 border-t border-slate-100 text-[11px] leading-relaxed">
                    {flyerItem.description}
                  </p>
                </div>

                {/* Safety Handover Note */}
                <div className="p-3 bg-indigo-50/80 rounded-lg border border-indigo-100 text-[11px] text-indigo-900 text-left flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Authorized Recovery Protocol</span>
                    <span>
                      If found, please surrender directly to Public Safety Central Desk (Admin Annex 102) or submit an ownership claim on the Campus Lost & Found portal.
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFlyerItem(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Print Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Report Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-base">Delete Report?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <span className="font-bold text-slate-800">"{deletingItem.title}"</span>? This will cancel any active AI matching for this item.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="py-2 px-3 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
              >
                Delete Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
