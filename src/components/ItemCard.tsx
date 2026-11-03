import React from 'react';
import { Item } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { TypeBadge, StatusBadge } from './StatusBadge';
import { CategoryIcon } from './CategoryIcon';
import {
  MapPin,
  Calendar,
  Bookmark,
  Sparkles,
  Gift,
  Eye,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface ItemCardProps {
  item: Item;
  onSelect: (item: Item) => void;
  showMatchIndicator?: boolean;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onSelect, showMatchIndicator }) => {
  const { categories, locations, isItemSaved, toggleSaveItem } = useData();
  const { currentUser } = useAuth();

  const category = categories.find((c) => c.id === item.category_id);
  const location = locations.find((l) => l.id === item.location_id);
  const isSaved = isItemSaved(item.id);

  const formattedDate = new Date(item.date_occurred).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSaveItem(item.id);
  };

  return (
    <div
      id={`item-card-${item.id}`}
      onClick={() => onSelect(item)}
      className="group relative bg-white border border-slate-200 hover:border-indigo-400 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col h-full"
    >
      {/* Image Container */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
        <img
          src={item.image_url}
          alt={item.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          onError={(e) => {
            // fallback placeholder image
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=80';
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <TypeBadge type={item.type} />
          {item.reward_info && (
            <span className="inline-flex items-center gap-1 bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-2xs">
              <Gift className="w-3 h-3" />
              Reward
            </span>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          title={isSaved ? 'Remove from saved' : 'Save this item'}
          className={`absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full backdrop-blur-md transition-all ${
            isSaved
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-black/40 hover:bg-black/60 text-white'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
        </button>

        {/* Bottom Gradient Overlay for Status */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 pt-6 flex items-end justify-between">
          <StatusBadge status={item.status} size="sm" />
          <span className="text-[11px] font-medium text-white/90 flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {item.views_count}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Time */}
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
              <CategoryIcon name={category?.icon || 'HelpCircle'} className="w-3.5 h-3.5 text-indigo-600" />
              {category?.name || 'Item'}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Calendar className="w-3 h-3 text-slate-400" />
              {formattedDate}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1">
            {item.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
            {item.description}
          </p>
        </div>

        {/* Location & Action Footer */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 truncate max-w-[80%]" title={`${location?.building || 'Campus'} - ${location?.name || ''}`}>
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium truncate text-slate-600 text-[11px]">
              {location?.building || location?.name || 'Campus Location'}
            </span>
          </div>

          <span className="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
