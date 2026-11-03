import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Item, FilterOptions, ItemType } from '../types';
import { ItemCard } from '../components/ItemCard';
import { CategoryIcon } from '../components/CategoryIcon';
import {
  Search,
  Filter,
  X,
  RotateCcw,
  SlidersHorizontal,
  MapPin,
  Calendar,
  Gift,
  ArrowUpDown,
  Sparkles,
  Layers,
} from 'lucide-react';

interface BrowseViewProps {
  initialSearch?: string;
  initialCategory?: string;
  initialType?: 'all' | 'lost' | 'found';
  onSelectItem: (item: Item) => void;
  onOpenReportModal: (type: 'lost' | 'found') => void;
}

export const BrowseView: React.FC<BrowseViewProps> = ({
  initialSearch = '',
  initialCategory = 'all',
  initialType = 'all',
  onSelectItem,
  onOpenReportModal,
}) => {
  const { categories, locations, filterItems } = useData();

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedType, setSelectedType] = useState<'all' | 'lost' | 'found'>(initialType);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [hasReward, setHasReward] = useState(false);
  const [sortBy, setSortBy] = useState<FilterOptions['sortBy']>('recent');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const filterOptions: FilterOptions = useMemo(() => {
    return {
      searchQuery,
      type: selectedType,
      categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
      locationId: selectedLocation === 'all' ? undefined : selectedLocation,
      status: selectedStatus === 'all' ? undefined : selectedStatus,
      hasReward: hasReward ? true : undefined,
      sortBy,
    };
  }, [
    searchQuery,
    selectedType,
    selectedCategory,
    selectedLocation,
    selectedStatus,
    hasReward,
    sortBy,
  ]);

  const filteredItems = filterItems(filterOptions);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedLocation('all');
    setSelectedStatus('all');
    setHasReward(false);
    setSortBy('recent');
  };

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (selectedType !== 'all' ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedLocation !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0) +
    (hasReward ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, title, color, location..."
              className="w-full pl-10 pr-8 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Controls */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end overflow-x-auto pb-1 md:pb-0">
            {/* Type Switcher Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  selectedType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedType('lost')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  selectedType === 'lost' ? 'bg-orange-600 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                Lost
              </button>
              <button
                onClick={() => setSelectedType('found')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  selectedType === 'found' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                Found
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-slate-50 focus:outline-none"
              >
                <option value="recent">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="views">Most Viewed</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>

            {/* Mobile Filter Drawer Button */}
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="md:hidden px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold flex items-center gap-1.5 bg-slate-50 text-slate-700"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar Filters + Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Desktop Sidebar Filters */}
        <aside
          className={`md:col-span-3 space-y-5 bg-white rounded-xl border border-slate-200 p-5 h-fit shadow-xs ${
            isMobileFilterOpen ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
              Filter Listings
            </h3>
            {activeFilterCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-orange-600 hover:text-orange-800 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {/* Categories */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
              Category
            </label>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between transition-colors ${
                  selectedCategory === 'all' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Categories</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between transition-colors ${
                    selectedCategory === cat.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <CategoryIcon name={cat.icon} className="w-3.5 h-3.5 text-indigo-500" />
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Campus Location */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
              Campus Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700"
            >
              <option value="all">All Campus Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.building} ({loc.name})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
              Item Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="lost">Active Lost</option>
              <option value="found">Available Found</option>
              <option value="claim_pending">Claim Pending</option>
              <option value="handover_pending">Handover Scheduled</option>
              <option value="recovered">Recovered</option>
            </select>
          </div>

          {/* Rewards Only Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={hasReward}
                onChange={(e) => setHasReward(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-amber-500" />
                With Finder's Reward
              </span>
            </label>
          </div>
        </aside>

        {/* Items Grid Area */}
        <main className="md:col-span-9 space-y-4">
          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-900">{filteredItems.length}</strong> matching item(s)
            </span>
          </div>

          {/* Grid */}
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
              <Layers className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No matching items found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try adjusting your search keywords, clear category filters, or report the item yourself.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => onOpenReportModal('lost')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                >
                  Report Lost Item
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <ItemCard key={item.id} item={item} onSelect={onSelectItem} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
