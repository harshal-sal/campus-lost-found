import React, { useState } from 'react';
import { ItemType, Item, Category, CampusLocation } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { CategoryIcon } from './CategoryIcon';
import {
  X,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Building,
  Upload,
  Image as ImageIcon,
  Lock,
  Gift,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

interface ReportItemModalProps {
  initialType?: ItemType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (item: Item) => void;
}

const PRESET_SAMPLE_PHOTOS = [
  {
    category: 'cat-electronics',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    name: 'MacBook Laptop',
  },
  {
    category: 'cat-electronics',
    url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&auto=format&fit=crop&q=80',
    name: 'AirPods Pro',
  },
  {
    category: 'cat-keys',
    url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80',
    name: 'Dorm & Bike Keys',
  },
  {
    category: 'cat-id-cards',
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
    name: 'Campus ID Card',
  },
  {
    category: 'cat-wallets',
    url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80',
    name: 'Leather Wallet',
  },
  {
    category: 'cat-bags',
    url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    name: 'Campus Backpack',
  },
  {
    category: 'cat-accessories',
    url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80',
    name: 'Water Bottle',
  },
  {
    category: 'cat-books',
    url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800&auto=format&fit=crop&q=80',
    name: 'Graphing Calculator',
  },
];

export const ReportItemModal: React.FC<ReportItemModalProps> = ({
  initialType = 'lost',
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { categories, locations, createItem } = useData();
  const { currentUser } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [type, setType] = useState<ItemType>(initialType);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-electronics');
  const [locationId, setLocationId] = useState(locations[0]?.id || 'loc-lib-main');
  const [locationDetail, setLocationDetail] = useState('');
  const [dateOccurred, setDateOccurred] = useState(new Date().toISOString().split('T')[0]);
  const [approximateTime, setApproximateTime] = useState('');
  const [description, setDescription] = useState('');
  const [distinguishingFeatures, setDistinguishingFeatures] = useState('');
  const [secretVerificationKey, setSecretVerificationKey] = useState('');
  const [currentHoldingLocation, setCurrentHoldingLocation] = useState('');
  const [rewardInfo, setRewardInfo] = useState('');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleNextStep = () => {
    setError('');
    if (step === 1) {
      if (!title.trim()) {
        setError('Please enter a descriptive item name.');
        return;
      }
      if (!dateOccurred) {
        setError('Please enter the date when this occurred.');
        return;
      }
    } else if (step === 2) {
      if (!description.trim() || description.length < 10) {
        setError('Please provide a detailed description (at least 10 characters).');
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setError('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please log in to report an item.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const created = await createItem({
        owner_id: currentUser.id,
        owner_name: currentUser.full_name,
        owner_email: currentUser.email,
        owner_type: currentUser.user_type,
        type,
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId,
        location_id: locationId,
        location_detail: locationDetail.trim(),
        date_occurred: dateOccurred,
        approximate_time: approximateTime.trim(),
        distinguishing_features: distinguishingFeatures.trim(),
        secret_verification_key: secretVerificationKey.trim(),
        reward_info: type === 'lost' ? rewardInfo.trim() : undefined,
        image_url: imageUrl,
        current_holding_location:
          type === 'found'
            ? currentHoldingLocation.trim() || 'Campus Lost & Found Office / Central Desk'
            : undefined,
        status: type === 'lost' ? 'lost' : 'found',
      });

      setIsSubmitting(false);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to submit report. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              {type === 'lost' ? (
                <>
                  <Search className="w-5 h-5 text-orange-600" />
                  Report Lost Property
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Report Found Property
                </>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Step {step} of 4: {step === 1 ? 'Overview' : step === 2 ? 'Location & Details' : step === 3 ? 'Private Verification' : 'Photo & Confirm'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-indigo-600 h-1 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 text-orange-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Overview */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Report Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('lost')}
                    className={`py-3 px-4 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      type === 'lost'
                        ? 'bg-orange-50 border-orange-400 text-orange-700 ring-2 ring-orange-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Search className="w-4 h-4 text-orange-600" />
                    I Lost Something
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('found')}
                    className={`py-3 px-4 rounded-lg border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      type === 'found'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700 ring-2 ring-emerald-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    I Found Something
                  </button>
                </div>
              </div>

              {/* Item Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item Title / Name *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Space Gray MacBook Pro 14, Blue Hydro Flask, Dorm Keys..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date {type === 'lost' ? 'Lost' : 'Found'} *
                  </label>
                  <input
                    type="date"
                    value={dateOccurred}
                    onChange={(e) => setDateOccurred(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Approximate Time
                  </label>
                  <input
                    type="text"
                    value={approximateTime}
                    onChange={(e) => setApproximateTime(e.target.value)}
                    placeholder="e.g. 14:30 or Around 2 PM"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Location & Description */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Campus Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Campus Building / Facility *
                </label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.building} — {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Detail */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Specific Room, Floor, or Area
                </label>
                <input
                  type="text"
                  value={locationDetail}
                  onChange={(e) => setLocationDetail(e.target.value)}
                  placeholder="e.g. 3rd Floor Silent Study Cubicle #14, Cafeteria checkout register #2..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* If Found: Current Holding Location */}
              {type === 'found' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Current Holding Location / Custody
                  </label>
                  <input
                    type="text"
                    value={currentHoldingLocation}
                    onChange={(e) => setCurrentHoldingLocation(e.target.value)}
                    placeholder="e.g. Main Library Front Desk, Admin Annex Room 102, Held by Finder..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Where the owner can claim or retrieve this item upon verification.
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item Description *
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the physical appearance, color, brand, condition, and any accessories included..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 3: Secret Verification & Features */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Public Distinguishing Features */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Public Visible Characteristics
                </label>
                <input
                  type="text"
                  value={distinguishingFeatures}
                  onChange={(e) => setDistinguishingFeatures(e.target.value)}
                  placeholder="e.g. Has stickers on top, blue carabiner, small dent on corner..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Visible to anyone searching to help recognize the item.
                </p>
              </div>

              {/* Secret Verification Key (STRICT PRIVACY) */}
              <div className="p-4 bg-slate-900 text-white rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  <Lock className="w-4 h-4" />
                  Private Verification Key (Hidden from Public)
                </div>
                <p className="text-xs text-slate-300">
                  Enter confidential details that ONLY the genuine owner would know (e.g. Serial number, engraved initials, lock screen wallpaper description, internal Sharpie markings).
                </p>
                <textarea
                  rows={3}
                  value={secretVerificationKey}
                  onChange={(e) => setSecretVerificationKey(e.target.value)}
                  placeholder="e.g. Serial number ends in 892X, Lock screen user name is Alex, secret sticker inside battery cover..."
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-500"
                />
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Only campus safety moderators review this during claim validation.
                </div>
              </div>

              {/* Reward info if Lost */}
              {type === 'lost' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-amber-500" />
                    Optional Finder's Reward
                  </label>
                  <input
                    type="text"
                    value={rewardInfo}
                    onChange={(e) => setRewardInfo(e.target.value)}
                    placeholder="e.g. $25 Campus Bookstore Gift Card, Coffee on me..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Photo Upload & Preset Selection */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Item Image / Photo
                </label>

                {/* Image Preview & Upload Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="aspect-4/3 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative shadow-2xs">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-lg cursor-pointer bg-slate-50 hover:bg-indigo-50/50 transition-all text-center">
                      <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                      <span className="text-xs font-bold text-slate-700">Upload Your Photo</span>
                      <span className="text-[11px] text-slate-500">PNG, JPG up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="text-[11px] text-slate-500 text-center font-medium">
                      Or paste an image URL:
                    </div>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Fast Campus Stock Photo Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Quick Campus Photo Presets:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_SAMPLE_PHOTOS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className={`relative aspect-4/3 rounded-lg overflow-hidden border transition-all ${
                        imageUrl === preset.url
                          ? 'border-indigo-600 ring-2 ring-indigo-500'
                          : 'border-slate-200 hover:opacity-80'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] font-semibold truncate px-1 py-0.5 text-center">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Review summary info */}
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <span className="font-bold">Instant Campus Matching: </span>
                  Upon submitting, our system will immediately cross-reference existing reports and notify you if a potential match is found.
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="pt-5 mt-6 border-t border-slate-200 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : (
              <div></div>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm rounded-lg shadow-xs flex items-center gap-2 transition-colors"
              >
                {isSubmitting ? (
                  'Publishing...'
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Publish {type === 'lost' ? 'Lost' : 'Found'} Report
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
