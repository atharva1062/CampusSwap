import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, MapPin, Eye, ArrowLeftRight, Sparkles, Clock } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Avatar from './Avatar';

export default function ProductCard({ listing, onSaveToggle }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [isSaved, setIsSaved] = useState(listing.isSaved || false);
  const [saving, setSaving] = useState(false);

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast('Please log in to save items to your wishlist', 'info');
      navigate('/login');
      return;
    }

    setSaving(true);
    try {
      const res = await API.post(`/listings/${listing.id}/save`);
      if (res.data.success) {
        setIsSaved(res.data.isSaved);
        showToast(res.data.message, 'success');
        if (onSaveToggle) onSaveToggle(listing.id, res.data.isSaved);
      }
    } catch (err) {
      showToast('Failed to update wishlist', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Badges based on type
  const getTypeBadge = () => {
    switch (listing.type) {
      case 'RENT':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-600 text-white shadow-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            RENT {listing.rentDuration ? `(${listing.rentDuration})` : ''}
          </span>
        );
      case 'SWAP':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500 text-white shadow-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            SWAP ONLY
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-600 text-white shadow-xs">
            FOR SALE
          </span>
        );
    }
  };

  const getConditionBadge = () => {
    const cond = listing.condition?.replace('_', ' ') || 'GOOD';
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-wider">
        {cond}
      </span>
    );
  };

  const discountPercent =
    listing.originalPrice && listing.originalPrice > listing.price
      ? Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)
      : null;

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-hover hover:-translate-y-1 transition-all duration-300 flex flex-col relative"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src={listing.imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          {getTypeBadge()}
          {listing.status !== 'AVAILABLE' && (
            <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
              {listing.status}
            </span>
          )}
        </div>

        {/* Bookmark Action */}
        <button
          onClick={handleBookmark}
          disabled={saving}
          className={`absolute top-2.5 right-2.5 p-2 rounded-xl backdrop-blur-md shadow-xs transition-transform active:scale-90 z-10 ${
            isSaved
              ? 'bg-rose-500 text-white'
              : 'bg-white/80 hover:bg-white text-slate-700 hover:text-rose-500'
          }`}
          title={isSaved ? 'Remove from Saved' : 'Save Item'}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Category Pill on Image */}
        {listing.category && (
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <span className="text-[11px] font-semibold bg-slate-900/70 text-white backdrop-blur-md px-2.5 py-1 rounded-lg">
              {listing.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Condition and Views */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            {getConditionBadge()}
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {listing.views}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug">
            {listing.title}
          </h3>

          {/* Swap Preference Snippet or Description */}
          {listing.type === 'SWAP' && listing.swapPreferences ? (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 p-1.5 rounded-lg mt-2 line-clamp-1">
              🔄 Wants: {listing.swapPreferences}
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
              {listing.description}
            </p>
          )}
        </div>

        {/* Price & Location */}
        <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-baseline justify-between">
            <div>
              {listing.type === 'SWAP' ? (
                <span className="text-sm font-extrabold text-amber-600">
                  Item Exchange
                </span>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-slate-900">
                    ₹{listing.price}
                  </span>
                  {listing.originalPrice && listing.originalPrice > listing.price && (
                    <span className="text-xs text-slate-400 line-through">
                      ₹{listing.originalPrice}
                    </span>
                  )}
                  {discountPercent && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Seller Avatar */}
            {listing.seller && (
              <div className="flex items-center gap-1.5" title={`Listed by ${listing.seller.name}`}>
                <Avatar
                  src={listing.seller.avatar}
                  alt={listing.seller.name}
                  className="w-5 h-5"
                  iconClassName="w-3 h-3"
                />
                <span className="text-xs text-slate-500 font-medium truncate max-w-[80px]">
                  {listing.seller.name.split(' ')[0]}
                </span>
              </div>
            )}
          </div>

          {/* Pickup location */}
          {listing.pickupLocation && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{listing.pickupLocation}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
