import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Item } from '../types';
import { ItemCard } from '../components/ItemCard';
import { CategoryIcon } from '../components/CategoryIcon';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  Layers,
  MapPin,
  Building,
  Check,
} from 'lucide-react';

interface HomeViewProps {
  onSelectItem: (item: Item) => void;
  onNavigate: (view: string) => void;
  onOpenReportModal: (type: 'lost' | 'found') => void;
  onSearch: (query: string, categoryId?: string, type?: 'all' | 'lost' | 'found') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectItem,
  onNavigate,
  onOpenReportModal,
  onSearch,
}) => {
  const { items, categories, handovers } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');

  const activeLostCount = items.filter((i) => i.type === 'lost' && i.status === 'lost').length;
  const activeFoundCount = items.filter((i) => i.type === 'found' && i.status === 'found').length;
  const recoveredCount = items.filter((i) => i.status === 'recovered').length + 142;

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery, undefined, filterType);
    onNavigate('browse');
  };

  const displayedItems = items
    .filter((i) => (filterType === 'all' ? true : i.type === filterType))
    .slice(0, 6);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. GEOMETRIC BALANCE HERO SECTION */}
      <section className="bg-indigo-700 text-white py-10 sm:py-14 px-4 sm:px-8 flex flex-col items-center shrink-0 relative overflow-hidden">
        {/* Geometric Translucent Circles */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-indigo-500 rounded-full opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-800 rounded-full opacity-30 pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl w-full text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-800/80 border border-indigo-500/40 text-indigo-200 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Verified Campus Lost & Found Network
          </div>

          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Lost something? Find it faster.
          </h1>

          {/* Search Bar with Geometric Balance Styling */}
          <form
            onSubmit={handleHeroSearch}
            className="w-full max-w-2xl mx-auto flex flex-col sm:flex-row gap-2 pt-2"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for keys, laptops, student ID, water bottles..."
                className="w-full pl-10 pr-4 py-3 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-lg bg-white"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            </div>
            <button
              type="submit"
              className="bg-slate-900 text-white px-7 py-3 rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shrink-0 flex items-center justify-center gap-1.5"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* 2. GEOMETRIC BALANCE MAIN 12-COL GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols): Recent Listings & Category Filters */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Header with Geometric Indicator & Filter Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
              Recent Listings
            </h2>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Items
              </button>
              <button
                onClick={() => setFilterType('lost')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  filterType === 'lost'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Lost
              </button>
              <button
                onClick={() => setFilterType('found')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  filterType === 'found'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Found
              </button>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayedItems.map((item) => (
              <ItemCard key={item.id} item={item} onSelect={onSelectItem} />
            ))}
          </div>

          {/* Bottom Link to browse all */}
          <div className="text-center pt-2">
            <button
              onClick={() => onNavigate('browse')}
              className="px-5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg shadow-2xs inline-flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              View Full Catalog ({items.length} items)
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column (4 cols): Quick Actions & Live Status Updates */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Quick Actions Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <span className="w-2 h-5 bg-indigo-600 rounded-full"></span>
              Quick Actions
            </h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => onOpenReportModal('lost')}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors text-center"
              >
                Report Lost Item
              </button>
              <button
                onClick={() => onOpenReportModal('found')}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 transition-colors text-center"
              >
                Report Found Item
              </button>
            </div>
          </div>

          {/* Status Updates Live Box */}
          <div className="bg-indigo-900 text-white rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <h2 className="font-bold mb-4 flex items-center justify-between">
                <span>Status Updates</span>
                <span className="bg-indigo-500 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Live
                </span>
              </h2>

              <div className="flex flex-col gap-4">
                <div className="flex gap-3 border-l-2 border-indigo-500 pl-4 py-1">
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold text-white">Claim Approved</p>
                    <p className="text-[11px] text-indigo-300">
                      Claim for 'AirPods Pro' verified by Campus Security.
                    </p>
                    <p className="text-[9px] text-indigo-400 mt-1 uppercase font-bold">2 mins ago</p>
                  </div>
                </div>

                <div className="flex gap-3 border-l-2 border-slate-600 pl-4 py-1">
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold text-slate-200">Handover Scheduled</p>
                    <p className="text-[11px] text-indigo-300">
                      Pickup set at Main Library Desk with 4-digit PIN.
                    </p>
                    <p className="text-[9px] text-indigo-400 mt-1 uppercase font-bold">1 hour ago</p>
                  </div>
                </div>

                <div className="flex gap-3 border-l-2 border-slate-600 pl-4 py-1">
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold text-slate-200">New Match Found</p>
                    <p className="text-[11px] text-indigo-300">
                      Similarity engine detected match for 'Navy Backpack'.
                    </p>
                    <p className="text-[9px] text-indigo-400 mt-1 uppercase font-bold">3 hours ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom KPI Counters with Geometric Dividers */}
            <div className="pt-4 border-t border-indigo-800 flex items-center justify-between">
              <div className="text-center">
                <p className="text-xl font-bold text-white">{recoveredCount}</p>
                <p className="text-[10px] uppercase text-indigo-400 font-semibold tracking-wider">
                  Recovered
                </p>
              </div>
              <div className="w-px h-8 bg-indigo-800"></div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">98%</p>
                <p className="text-[10px] uppercase text-indigo-400 font-semibold tracking-wider">
                  Trust Score
                </p>
              </div>
              <div className="w-px h-8 bg-indigo-800"></div>
              <div className="text-center">
                <p className="text-xl font-bold text-white">{items.length}</p>
                <p className="text-[10px] uppercase text-indigo-400 font-semibold tracking-wider">
                  Total Items
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. CATEGORY EXPLORER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
            Browse by Category
          </h2>
          <button
            onClick={() => onNavigate('browse')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            All Categories
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat) => {
            const count = items.filter((i) => i.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSearch('', cat.id);
                  onNavigate('browse');
                }}
                className="group p-3.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 shadow-2xs hover:shadow-xs transition-all text-center flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <CategoryIcon name={cat.icon} className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                    {cat.name.split('&')[0]}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {count} {count === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. TRUST & VERIFICATION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="max-w-3xl mx-auto text-center space-y-2 mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              Secure Campus Recovery Protocol
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Personal identifying details are kept private until verified by campus safety officers and confirmed with physical handover PINs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="w-7 h-7 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="font-bold text-xs text-slate-800">Hidden Verification Keys</h4>
              <p className="text-[11px] text-slate-500">
                Lock screens, serial numbers, and private marks remain confidential from public view.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="w-7 h-7 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="font-bold text-xs text-slate-800">Officer Verification</h4>
              <p className="text-[11px] text-slate-500">
                Security staff reviews claimant answers against confidential proofs before authorizing.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="w-7 h-7 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="font-bold text-xs text-slate-800">4-Digit Security PIN</h4>
              <p className="text-[11px] text-slate-500">
                Retrieve items safely at designated circulation and security desks using a secret PIN.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
